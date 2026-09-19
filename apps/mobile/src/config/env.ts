/**
 * Runtime configuration. Everything here is public (bundled into the app):
 * never put a secret in an EXPO_PUBLIC_* variable.
 */

// Android emulators reach the host at 10.0.2.2, not localhost.
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000').replace(
  /\/$/,
  ''
);

/** Wire version sent as `X-API-Version`; the backend echoes the version it speaks. */
export const API_VERSION = '1';
export const API_PREFIX = '/api/v1';

export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Explicit demo mode. When true the app renders its bundled sample fixtures so
 * the approved designs can be reviewed without a backend, and a persistent
 * banner says so. It is off by default and must never be on in a real build.
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
