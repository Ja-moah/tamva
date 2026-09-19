/**
 * The only place the app talks HTTP.
 *
 * Auth is the backend's cookie session (there is no token API). The native
 * networking stack keeps the session cookie; JavaScript never sees it. Unsafe
 * requests must echo a CSRF token, which native code cannot read from a cookie,
 * so it is fetched from GET /auth/csrf/ and cached in memory.
 */
import { csrfEnvelopeSchema } from '@tamva/client-contracts';

import { API_PREFIX, API_BASE_URL, API_VERSION, REQUEST_TIMEOUT_MS } from '../config/env';
import { ApiError } from './errors';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const SAFE: ReadonlySet<Method> = new Set(['GET']);

export interface RuntimeSchema<T> {
  parse(value: unknown): T;
}

export interface RequestOptions {
  method?: Method;
  /** Path under /api/v1, e.g. "/me/". */
  path: string;
  /** Use for unversioned endpoints such as /health/. */
  unversioned?: boolean;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  idempotencyKey?: string;
}

export interface ApiClientConfig {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
  newRequestId?: () => string;
  /** Called when a call outside the sign-in flow comes back 401. */
  onUnauthenticated?: () => void;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function defaultRequestId(): string {
  const cryptoRef = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return cryptoRef?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// Endpoints whose 401 is an expected answer rather than an ended session.
const SESSION_PROBES = new Set(['/auth/login/', '/me/', '/auth/csrf/']);
const RETRYABLE_STATUS = new Set([502, 503, 504]);

export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = (config.baseUrl ?? API_BASE_URL).replace(/\/$/, '');
  const doFetch = config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const timeoutMs = config.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const maxRetries = config.maxRetries ?? 2;
  const sleep = config.sleep ?? defaultSleep;
  const newRequestId = config.newRequestId ?? defaultRequestId;

  let csrfToken: string | null = null;
  let onUnauthenticated = config.onUnauthenticated ?? null;

  const buildUrl = (opts: RequestOptions): string => {
    const url = `${baseUrl}${opts.unversioned ? '' : API_PREFIX}${opts.path}`;
    if (!opts.query) return url;
    const params = Object.entries(opts.query)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    return params.length ? `${url}?${params.join('&')}` : url;
  };

  async function send(
    opts: RequestOptions,
    requestId: string,
    withCsrf: boolean
  ): Promise<Response> {
    const method = opts.method ?? 'GET';
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Request-ID': requestId,
      'X-API-Version': API_VERSION,
    };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
    if (withCsrf && !SAFE.has(method)) {
      headers['X-CSRFToken'] = await getCsrfToken();
    }

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
        method,
        headers,
        credentials: 'include',
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

  const isCsrfRefusal = (error: ApiError) =>
    error.status === 403 && JSON.stringify(error.details ?? '').toLowerCase().includes('csrf');

  async function getCsrfToken(force = false): Promise<string> {
    if (csrfToken && !force) return csrfToken;
    const requestId = newRequestId();
    const response = await send({ path: '/auth/csrf/' }, requestId, false);
    if (!response.ok) throw await toApiError(response, requestId);
    csrfToken = csrfEnvelopeSchema.parse(await response.json()).data.csrf_token;
    return csrfToken;
  }

  /** Runs the request and returns the raw JSON body (undefined for 204/no body). */
  async function run(opts: RequestOptions): Promise<unknown> {
    const method = opts.method ?? 'GET';
    const requestId = newRequestId();
    const retries = method === 'GET' ? maxRetries : 0;
    let csrfRetried = false;

    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await send(opts, requestId, true);
      } catch (error) {
        if (error instanceof ApiError && error.isConnectivity && attempt < retries) {
          await sleep(300 * 2 ** attempt);
          continue;
        }
        throw error;
      }

      if (response.ok) {
        return response.status === 204 ? undefined : await response.json();
      }

      if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
        await sleep(300 * 2 ** attempt);
        continue;
      }
      const error = await toApiError(response, requestId);
      if (isCsrfRefusal(error) && !csrfRetried) {
        csrfRetried = true;
        csrfToken = null; // the token rotates on sign-in; fetch a fresh one and retry once
        continue;
      }
      if (error.isUnauthenticated && !SESSION_PROBES.has(opts.path)) onUnauthenticated?.();
      throw error;
    }
  }

  async function request<T>(
    opts: RequestOptions & { schema: RuntimeSchema<T> }
  ): Promise<T> {
    return opts.schema.parse(await run(opts));
  }

  /** For endpoints that return no body (204). */
  async function requestVoid(opts: RequestOptions): Promise<void> {
    await run(opts);
  }

  return {
    request,
    requestVoid,
    /** Drop the cached CSRF token (call after sign-in/out: it rotates). */
    resetCsrf: () => {
      csrfToken = null;
    },
    /** Fetch and cache a fresh token now. */
    refreshCsrf: () => getCsrfToken(true),
    setUnauthenticatedHandler: (handler: (() => void) | null) => {
      onUnauthenticated = handler;
    },
  };
}

export const apiClient = createApiClient();
