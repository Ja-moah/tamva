/**
 * The only place the app talks HTTP.
 *
 * Auth is a short-lived bearer access token plus a rotating refresh token
 * (ADR-013). The access token lives in memory only. The refresh token lives in
 * memory and, on native, in SecureStore via an injected persistence adapter
 * (nothing is persisted on the web). A 401 on a normal call triggers one
 * single-flight refresh and one retry; if refresh fails the session is over.
 */
import { refreshEnvelopeSchema, type TokenPair } from '@tamva/client-contracts';
import type { z } from 'zod';

import { API_PREFIX, API_BASE_URL, API_VERSION, REQUEST_TIMEOUT_MS } from '../config/env';
import { ApiError } from './errors';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions<S extends z.ZodType = z.ZodType> {
  method?: Method;
  /** Path under /api/v1, e.g. "/me/". */
  path: string;
  /** Use for unversioned endpoints such as /health/. */
  unversioned?: boolean;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  schema?: S;
  signal?: AbortSignal;
  idempotencyKey?: string;
  /** Sign-in style calls: no bearer header, and a 401 is an answer, not an ended session. */
  anonymous?: boolean;
}

/** Where the refresh token survives an app restart. Native only. */
export interface RefreshPersistence {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ApiClientConfig {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
  newRequestId?: () => string;
  persistence?: RefreshPersistence;
  /** Called when the session can no longer be continued (refresh refused). */
  onUnauthenticated?: () => void;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function defaultRequestId(): string {
  const cryptoRef = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return cryptoRef?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const RETRYABLE_STATUS = new Set([502, 503, 504]);

export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = (config.baseUrl ?? API_BASE_URL).replace(/\/$/, '');
  const doFetch = config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const timeoutMs = config.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const maxRetries = config.maxRetries ?? 2;
  const sleep = config.sleep ?? defaultSleep;
  const newRequestId = config.newRequestId ?? defaultRequestId;

  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let persistence = config.persistence ?? null;
  let onUnauthenticated = config.onUnauthenticated ?? null;
  let refreshing: Promise<boolean> | null = null;

  const buildUrl = (opts: RequestOptions): string => {
    const url = `${baseUrl}${opts.unversioned ? '' : API_PREFIX}${opts.path}`;
    if (!opts.query) return url;
    const params = Object.entries(opts.query)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    return params.length ? `${url}?${params.join('&')}` : url;
  };

  async function send(opts: RequestOptions, requestId: string): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Request-ID': requestId,
      'X-API-Version': API_VERSION,
    };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
    if (accessToken && !opts.anonymous) headers.Authorization = `Bearer ${accessToken}`;

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onCallerAbort = () => controller.abort();
    opts.signal?.addEventListener('abort', onCallerAbort);
    try {
      return await doFetch(buildUrl(opts), {
        method: opts.method ?? 'GET',
        headers,
        // Bearer auth: no ambient cookies are sent or needed.
        credentials: 'omit',
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: controller.signal,
      });
    } catch (error) {
      if (opts.signal?.aborted) throw error; // a caller cancel is not a failure
      throw new ApiError({
        kind: timedOut ? 'timeout' : 'network',
        code: timedOut ? 'timeout' : 'network_error',
        message: timedOut ? 'The request timed out.' : 'The network request failed.',
        requestId,
      });
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener('abort', onCallerAbort);
    }
  }

  async function toApiError(response: Response, requestId: string): Promise<ApiError> {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // Proxy error pages and empty bodies fall through to a generic error.
    }
    const envelope = (payload as { error?: { code?: string; message?: string; request_id?: string; details?: unknown } } | null)
      ?.error;
    return new ApiError({
      kind: 'http',
      status: response.status,
      code: envelope?.code ?? 'http_error',
      message: envelope?.message ?? `Request failed with status ${response.status}`,
      requestId: envelope?.request_id || response.headers.get('X-Request-ID') || requestId,
      details: envelope?.details ?? payload,
    });
  }

  const adopt = async (pair: TokenPair) => {
    accessToken = pair.access_token;
    refreshToken = pair.refresh_token;
    await persistence?.write(pair.refresh_token).catch(() => undefined);
  };

  /** One refresh at a time; concurrent callers share the result. */
  function refreshOnce(): Promise<boolean> {
    if (!refreshToken) return Promise.resolve(false);
    refreshing ??= (async () => {
      const requestId = newRequestId();
      try {
        const response = await send(
          { method: 'POST', path: '/auth/token/refresh/', body: { refresh_token: refreshToken }, anonymous: true },
          requestId
        );
        if (!response.ok) {
          // A refused refresh means the session is over; a server fault does not.
          if (response.status === 401 || response.status === 403 || response.status === 400) {
            accessToken = refreshToken = null;
            await persistence?.clear().catch(() => undefined);
          }
          return false;
        }
        await adopt(refreshEnvelopeSchema.parse(await response.json()).data);
        return true;
      } catch {
        return false; // connectivity: keep the tokens, let the caller see the failure
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  }

  async function run(opts: RequestOptions): Promise<unknown> {
    const method = opts.method ?? 'GET';
    const requestId = newRequestId();
    const retries = method === 'GET' ? maxRetries : 0;
    let refreshed = false;

    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await send(opts, requestId);
      } catch (error) {
        if (error instanceof ApiError && error.isConnectivity && attempt < retries) {
          await sleep(300 * 2 ** attempt);
          continue;
        }
        throw error;
      }

      if (response.ok) return response.status === 204 ? undefined : await response.json();

      if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
        await sleep(300 * 2 ** attempt);
        continue;
      }
      if (response.status === 401 && !opts.anonymous && !refreshed && refreshToken) {
        refreshed = true;
        if (await refreshOnce()) continue;
        if (!refreshToken) onUnauthenticated?.();
      } else if (response.status === 401 && !opts.anonymous && !refreshToken && accessToken) {
        accessToken = null;
        onUnauthenticated?.();
      }
      throw await toApiError(response, requestId);
    }
  }

  async function request<S extends z.ZodType>(
    opts: Omit<RequestOptions, 'schema'> & { schema: S }
  ): Promise<z.infer<S>> {
    return opts.schema.parse(await run(opts)) as z.infer<S>;
  }

  /** For endpoints that return no body (204). */
  async function requestVoid(opts: RequestOptions): Promise<void> {
    await run(opts);
  }

  return {
    request,
    requestVoid,
    /** Adopt a token pair from sign-in. */
    setTokens: adopt,
    /** Forget every credential (sign-out, session end). */
    clearTokens: async () => {
      accessToken = refreshToken = null;
      await persistence?.clear().catch(() => undefined);
    },
    hasSession: () => accessToken !== null || refreshToken !== null,
    getRefreshToken: () => refreshToken,
    /** Restore a persisted refresh token and mint an access token from it. */
    restoreSession: async (): Promise<'restored' | 'none' | 'unreachable'> => {
      refreshToken ??= (await persistence?.read().catch(() => null)) ?? null;
      if (!refreshToken) return 'none';
      if (await refreshOnce()) return 'restored';
      return refreshToken ? 'unreachable' : 'none';
    },
    setPersistence: (next: RefreshPersistence | null) => {
      persistence = next;
    },
    setUnauthenticatedHandler: (handler: (() => void) | null) => {
      onUnauthenticated = handler;
    },
  };
}

export const apiClient = createApiClient();
