import { describe, expect, it } from 'vitest';

import { resolveConfig } from './resolve';

const prod = { EXPO_PUBLIC_APP_ENV: 'production', EXPO_PUBLIC_API_BASE_URL: 'https://api.tamva-prod.io' };

describe('resolveConfig', () => {
  it('defaults to development with the local API', () => {
    expect(resolveConfig({})).toEqual({
      appEnv: 'development',
      apiBaseUrl: 'http://localhost:8000',
      demoMode: false,
    });
  });

  it('lets development point at an emulator or LAN address', () => {
    expect(resolveConfig({ EXPO_PUBLIC_API_BASE_URL: 'http://10.0.2.2:8000/' }).apiBaseUrl).toBe(
      'http://10.0.2.2:8000'
    );
  });

  it('allows demo mode only in development', () => {
    expect(resolveConfig({ EXPO_PUBLIC_DEMO_MODE: 'true' }).demoMode).toBe(true);
    expect(() => resolveConfig({ ...prod, EXPO_PUBLIC_DEMO_MODE: 'true' })).toThrow(/Demo mode/);
  });

  it('accepts a clean https origin for staging and production', () => {
    expect(resolveConfig(prod)).toEqual({
      appEnv: 'production',
      apiBaseUrl: 'https://api.tamva-prod.io',
      demoMode: false,
    });
    expect(
      resolveConfig({ ...prod, EXPO_PUBLIC_APP_ENV: 'staging', EXPO_PUBLIC_API_BASE_URL: 'https://api.staging.tamva-prod.io/' })
        .apiBaseUrl
    ).toBe('https://api.staging.tamva-prod.io');
  });

  it.each([
    ['missing', undefined, /required/],
    ['http', 'http://api.tamva-prod.io', /https/],
    ['localhost', 'https://localhost:8000', /local, private/],
    ['emulator alias', 'https://10.0.2.2', /local, private/],
    ['LAN address', 'https://192.168.1.20', /local, private/],
    ['172.16 range', 'https://172.20.0.5', /local, private/],
    ['loopback', 'https://127.0.0.1', /local, private/],
    ['placeholder domain', 'https://api.example.com', /placeholder/],
    ['path', 'https://api.tamva-prod.io/api/v1', /bare origin/],
    ['credentials', 'https://user:pw@api.tamva-prod.io', /bare origin/],
    ['garbage', 'not a url', /valid URL/],
  ])('rejects a %s API URL in production', (_name, url, message) => {
    expect(() => resolveConfig({ EXPO_PUBLIC_APP_ENV: 'production', EXPO_PUBLIC_API_BASE_URL: url })).toThrow(message);
  });

  it('rejects an unknown environment name', () => {
    expect(() => resolveConfig({ EXPO_PUBLIC_APP_ENV: 'prod' })).toThrow(/must be one of/);
  });
});
