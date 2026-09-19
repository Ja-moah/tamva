/**
 * Runtime configuration. Everything here is public (bundled into the app):
 * never put a secret in an EXPO_PUBLIC_* variable.
 */
import { resolveConfig } from './resolve';

// Read each variable by its literal name: Expo only inlines `process.env.EXPO_PUBLIC_*`
// accesses it can see statically.
const config = resolveConfig({
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_DEMO_MODE: process.env.EXPO_PUBLIC_DEMO_MODE,
});

/** development | staging | production. Android emulators reach the host at 10.0.2.2. */
export const APP_ENV = config.appEnv;
export const API_BASE_URL = config.apiBaseUrl;

/** Wire version sent as `X-API-Version`; the backend echoes the version it speaks. */
export const API_VERSION = '1';
export const API_PREFIX = '/api/v1';

export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Explicit demo mode. When true the app renders its bundled sample fixtures so
 * the approved designs can be reviewed without a backend, and a persistent
 * banner says so. It is off by default and must never be on in a real build.
 */
export const DEMO_MODE = config.demoMode;
