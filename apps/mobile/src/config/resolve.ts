/**
 * Pure configuration resolution, kept free of `process.env` so it is unit-testable.
 * Everything here is public (bundled into the app): never put a secret in an
 * EXPO_PUBLIC_* variable.
 */

export type AppEnv = 'development' | 'staging' | 'production';

export interface PublicEnv {
  EXPO_PUBLIC_APP_ENV?: string;
  EXPO_PUBLIC_API_BASE_URL?: string;
  EXPO_PUBLIC_DEMO_MODE?: string;
}

export interface ResolvedConfig {
  appEnv: AppEnv;
  apiBaseUrl: string;
  demoMode: boolean;
}

const DEV_API_URL = 'http://localhost:8000';
const APP_ENVS: readonly AppEnv[] = ['development', 'staging', 'production'];
const PLACEHOLDER_HOSTS = /(^|\.)example\.(com|org|net)$|\.invalid$|\.test$/i;

function isLocalOrPrivateHost(host: string): boolean {
  if (host === 'localhost' || host.endsWith('.local') || host === '10.0.2.2') return true;
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return (
      a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 169 && b === 254)
    );
  }
  return host === '[::1]' || host.startsWith('[fc') || host.startsWith('[fd');
}

export function resolveConfig(env: PublicEnv): ResolvedConfig {
  const rawEnv = (env.EXPO_PUBLIC_APP_ENV ?? 'development').trim();
  if (!(APP_ENVS as readonly string[]).includes(rawEnv)) {
    throw new Error(`EXPO_PUBLIC_APP_ENV must be one of ${APP_ENVS.join(', ')} (got "${rawEnv}").`);
  }
  const appEnv = rawEnv as AppEnv;
  const demoMode = env.EXPO_PUBLIC_DEMO_MODE === 'true';
  const configured = env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');

  if (appEnv === 'development') {
    return { appEnv, apiBaseUrl: configured || DEV_API_URL, demoMode };
  }

  // Staging and production builds fail loudly rather than ship a wrong target.
  if (!configured) {
    throw new Error(`EXPO_PUBLIC_API_BASE_URL is required for ${appEnv} builds.`);
  }
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error(`EXPO_PUBLIC_API_BASE_URL is not a valid URL for a ${appEnv} build.`);
  }
  if (url.protocol !== 'https:') {
    throw new Error(`${appEnv} builds must use an https API URL.`);
  }
  if (isLocalOrPrivateHost(url.hostname) || PLACEHOLDER_HOSTS.test(url.hostname)) {
    throw new Error(`${appEnv} builds must not point at a local, private or placeholder host.`);
  }
  if (url.pathname !== '/' || url.search || url.username) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must be a bare origin (no path, query or credentials).');
  }
  if (demoMode) {
    throw new Error(`Demo mode must never be enabled in a ${appEnv} build.`);
  }
  return { appEnv, apiBaseUrl: url.origin, demoMode: false };
}
