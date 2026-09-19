import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createApiClient, type RefreshPersistence } from './client';

const schema = z.object({ ok: z.boolean() });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const pair = (n: number) => ({
  token_type: 'Bearer' as const,
  access_token: `access-${n}`,
  refresh_token: `refresh-${n}`,
  access_expires_at: '2030-01-01T00:00:00Z',
  refresh_expires_at: '2030-02-01T00:00:00Z',
});
const memory = (initial: string | null = null): RefreshPersistence & { value: string | null } => {
  const store = { value: initial } as RefreshPersistence & { value: string | null };
  store.read = async () => store.value;
  store.write = async (t) => {
    store.value = t;
  };
  store.clear = async () => {
    store.value = null;
  };
  return store;
};

describe('customer API client', () => {
  it('sends version, request ID and a bearer token, and never cookies', async () => {
    const fetchImpl = vi.fn(async () => json({ ok: true }));
    const client = createApiClient({ baseUrl: 'https://api.example', fetchImpl, newRequestId: () => 'request-1' });
    await client.setTokens(pair(1));

    await expect(client.request({ path: '/example/', schema })).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example/api/v1/example/',
      expect.objectContaining({
        credentials: 'omit',
        headers: expect.objectContaining({
          'X-API-Version': '1',
          'X-Request-ID': 'request-1',
          Authorization: 'Bearer access-1',
        }),
      })
    );
  });

  it('refreshes once on a 401, retries the call, and persists the rotated refresh token', async () => {
    const persistence = memory();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ data: pair(2) }))
      .mockResolvedValueOnce(json({ ok: true })) as unknown as typeof fetch;
    const client = createApiClient({ fetchImpl, persistence });
    await client.setTokens(pair(1));

    await expect(client.request({ path: '/example/', schema })).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(persistence.value).toBe('refresh-2');
    const retry = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[2][1];
    expect(retry.headers.Authorization).toBe('Bearer access-2');
  });

  it('shares one refresh between concurrent calls', async () => {
    let refreshes = 0;
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith('/auth/token/refresh/')) {
        refreshes++;
        return json({ data: pair(2) });
      }
      const auth = (init?.headers as Record<string, string>).Authorization;
      return auth === 'Bearer access-2' ? json({ ok: true }) : json({}, 401);
    }) as unknown as typeof fetch;
    const client = createApiClient({ fetchImpl });
    await client.setTokens(pair(1));

    await Promise.all([client.request({ path: '/a/', schema }), client.request({ path: '/b/', schema })]);
    expect(refreshes).toBe(1);
  });

  it('ends the session and clears storage when the refresh token is refused', async () => {
    const persistence = memory('refresh-1');
    const onUnauthenticated = vi.fn();
    const fetchImpl = vi.fn(async (url: string) =>
      String(url).endsWith('/auth/token/refresh/') ? json({}, 401) : json({}, 401)
    ) as unknown as typeof fetch;
    const client = createApiClient({ fetchImpl, persistence, onUnauthenticated });
    await client.setTokens(pair(1));

    await expect(client.request({ path: '/example/', schema })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
    expect(persistence.value).toBeNull();
    expect(client.hasSession()).toBe(false);
  });

  it('keeps the session when refresh fails only because the network is down', async () => {
    const onUnauthenticated = vi.fn();
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).endsWith('/auth/token/refresh/')) throw new TypeError('offline');
      return json({}, 401);
    }) as unknown as typeof fetch;
    const client = createApiClient({ fetchImpl, onUnauthenticated, maxRetries: 0 });
    await client.setTokens(pair(1));

    await expect(client.request({ path: '/example/', schema })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(client.hasSession()).toBe(true);
  });

  it('restores a persisted session on start, and reports none / unreachable honestly', async () => {
    const ok = createApiClient({
      persistence: memory('refresh-9'),
      fetchImpl: vi.fn(async () => json({ data: pair(3) })) as unknown as typeof fetch,
    });
    await expect(ok.restoreSession()).resolves.toBe('restored');

    const none = createApiClient({ persistence: memory(null), fetchImpl: vi.fn() as unknown as typeof fetch });
    await expect(none.restoreSession()).resolves.toBe('none');

    const down = createApiClient({
      persistence: memory('refresh-9'),
      fetchImpl: vi.fn(async () => {
        throw new TypeError('offline');
      }) as unknown as typeof fetch,
    });
    await expect(down.restoreSession()).resolves.toBe('unreachable');
  });

  it('does not treat an anonymous 401 (bad password) as an ended session', async () => {
    const onUnauthenticated = vi.fn();
    const client = createApiClient({ fetchImpl: vi.fn(async () => json({}, 401)) as unknown as typeof fetch, onUnauthenticated });
    await expect(client.request({ method: 'POST', path: '/auth/token/', schema, anonymous: true })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it('retries a safe request after a temporary upstream failure but never a mutation', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({}, 503))
      .mockResolvedValueOnce(json({ ok: true })) as unknown as typeof fetch;
    const client = createApiClient({ fetchImpl, sleep: async () => undefined, maxRetries: 1 });
    await expect(client.request({ path: '/example/', schema })).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const post = vi.fn(async () => json({}, 503)) as unknown as typeof fetch;
    const c2 = createApiClient({ fetchImpl: post, sleep: async () => undefined, maxRetries: 2 });
    await expect(c2.request({ method: 'POST', path: '/x/', schema })).rejects.toMatchObject({ status: 503 });
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('surfaces the backend error envelope without leaking implementation detail', async () => {
    const fetchImpl = vi.fn(async () =>
      json({ error: { code: 'permission_denied', message: 'Not allowed', request_id: 'server-1' } }, 403)
    ) as unknown as typeof fetch;
    const client = createApiClient({ fetchImpl, maxRetries: 0 });

    await expect(client.request({ path: '/private/', schema })).rejects.toMatchObject({
      code: 'permission_denied',
      status: 403,
      requestId: 'server-1',
    });
  });
});
