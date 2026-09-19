export type ApiErrorKind = 'http' | 'network' | 'timeout';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly details: unknown;

  constructor(init: {
    kind: ApiErrorKind;
    status?: number;
    code: string;
    message: string;
    requestId?: string | null;
    details?: unknown;
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status ?? 0;
    this.code = init.code;
    this.requestId = init.requestId ?? null;
    this.details = init.details;
  }

  get isUnauthenticated(): boolean {
    return this.kind === 'http' && this.status === 401;
  }

  get isForbidden(): boolean {
    return this.kind === 'http' && this.status === 403;
  }

  /** No answer from the server at all: offline, DNS, refused, or too slow. */
  get isConnectivity(): boolean {
    return this.kind === 'network' || this.kind === 'timeout';
  }

  get isServerFault(): boolean {
    return this.kind === 'http' && this.status >= 500;
  }
}

/** Plain-language text for an error, safe to show a customer. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === 'timeout') return 'The request took too long. Check your connection and try again.';
    if (error.kind === 'network') return "You appear to be offline, or TAMVA can't be reached.";
    if (error.status === 429) return 'Too many attempts. Wait a moment and try again.';
    if (error.status >= 500) return 'TAMVA had a problem handling that. Please try again shortly.';
    if (error.status === 401) return 'Your session has ended. Please sign in again.';
    if (error.status === 403) return "You don't have access to that.";
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
