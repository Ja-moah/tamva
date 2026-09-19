import {
  API_VERSION_PREFIX,
  HEADER_INSTITUTION_ID,
  HEADER_REQUEST_ID,
  apiErrorEnvelopeSchema,
  type ApiErrorEnvelope,
} from "@tamva/client-contracts";
import type { z } from "zod";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

// The active institution is session state, not a per-call argument, so every
// request carries the tenant header without each screen having to remember it.
let activeInstitutionId: string | null = null;

export function setActiveInstitution(institutionId: string | null): void {
  activeInstitutionId = institutionId;
}

export function getActiveInstitution(): string | null {
  return activeInstitutionId;
}

// Called when an authenticated call comes back 401 (an expired or revoked
// session), so the app can return to the login screen from anywhere.
let unauthenticatedHandler: (() => void) | null = null;

export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  unauthenticatedHandler = handler;
}

// Endpoints whose 401 is an expected answer, not an expired session.
const SESSION_PROBE_PATHS = new Set(["/auth/login/", "/me/"]);

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, requestId: string | null, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

function newRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// Django sets `csrftoken` (not HttpOnly) after login; unsafe session-auth
// requests must echo it back.
function csrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export interface RequestOptions<S extends z.ZodType> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Path relative to the versioned API root, e.g. "/me/". Use `unversioned` for /health/. */
  path: string;
  unversioned?: boolean;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  /** Response schema; omit for 204 responses. */
  schema?: S;
  signal?: AbortSignal;
  /** Makes a retried mutation safe: the backend replays the first result for the same key. */
  idempotencyKey?: string;
  /** Override the ambient institution for this call only. */
  institutionId?: string | null;
}

function buildUrl(path: string, unversioned: boolean, query: RequestOptions<z.ZodType>["query"]): string {
  const url = `${apiBaseUrl}${unversioned ? "" : API_VERSION_PREFIX}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function toApiError(response: Response, requestId: string): Promise<ApiError> {
  const responseRequestId = response.headers.get(HEADER_REQUEST_ID) ?? requestId;
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON error bodies (proxy 502s, HTML pages) fall through to a generic error.
  }
  const envelope = apiErrorEnvelopeSchema.safeParse(payload);
  if (envelope.success) {
    const { code, message, request_id, details }: ApiErrorEnvelope["error"] = envelope.data.error;
    return new ApiError(response.status, code, message, request_id || responseRequestId, details);
  }
  return new ApiError(
    response.status,
    "http_error",
    `Request failed with status ${response.status}`,
    responseRequestId,
    payload,
  );
}

export async function apiRequest<S extends z.ZodType>(options: RequestOptions<S>): Promise<z.infer<S>> {
  const method = options.method ?? "GET";
  const requestId = newRequestId();
  const institutionId = options.institutionId === undefined ? activeInstitutionId : options.institutionId;

  const headers: Record<string, string> = {
    Accept: "application/json",
    [HEADER_REQUEST_ID]: requestId,
  };
  if (institutionId) headers[HEADER_INSTITUTION_ID] = institutionId;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
  if (!SAFE_METHODS.has(method)) {
    const token = csrfToken();
    if (token) headers["X-CSRFToken"] = token;
  }

  const response = await fetch(buildUrl(options.path, options.unversioned ?? false, options.query), {
    method,
    headers,
    credentials: "include",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!response.ok) {
    if (response.status === 401 && !SESSION_PROBE_PATHS.has(options.path)) unauthenticatedHandler?.();
    throw await toApiError(response, requestId);
  }
  if (!options.schema || response.status === 204) return undefined as z.infer<S>;
  return options.schema.parse(await response.json());
}

/** Fetch a binary file (e.g. an export) with the same auth, tenant and tracing headers. */
export async function apiBlob(
  path: string,
  query?: Record<string, string>,
): Promise<{ blob: Blob; filename: string | null }> {
  const requestId = newRequestId();
  const headers: Record<string, string> = { [HEADER_REQUEST_ID]: requestId };
  if (activeInstitutionId) headers[HEADER_INSTITUTION_ID] = activeInstitutionId;
  const response = await fetch(buildUrl(path, false, query), {
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 401) unauthenticatedHandler?.();
    throw await toApiError(response, requestId);
  }
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/);
  return { blob: await response.blob(), filename: match ? match[1] : null };
}
