import { describe, expect, it, vi } from 'vitest';

import { createApiClient } from './client';

const schema = { parse: (value: unknown) => value as { ok: boolean } };

describe('customer API client', () => {
  it('sends version, request ID and cookies and validates the response', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const client = createApiClient({ baseUrl: 'https://api.example', fetchImpl, newRequestId: () => 'request-1' });

    await expect(client.request({ path: '/example/', schema })).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example/api/v1/example/',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ 'X-API-Version': '1', 'X-Request-ID': 'request-1' }),
      })
    );
  });

  it('retries a safe request after a temporary upstream failure', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
    const client = createApiClient({ fetchImpl, sleep: async () => undefined, maxRetries: 1 });

    await expect(client.request({ path: '/example/', schema })).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('surfaces the backend error envelope without leaking implementation detail', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: { code: 'permission_denied', message: 'Not allowed', request_id: 'server-1' },
    }), { status: 403 }));
    const client = createApiClient({ fetchImpl, maxRetries: 0 });

    await expect(client.request({ path: '/private/', schema })).rejects.toMatchObject({
      code: 'permission_denied', status: 403, requestId: 'server-1',
    });
  });
});
