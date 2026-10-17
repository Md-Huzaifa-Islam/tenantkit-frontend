import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, refreshSession, tokens } from './api';

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const session = { accessToken: 'fresh', expiresIn: 900, user: { id: 'u1', email: 'a@b.c', name: 'A', avatarUrl: null, emailVerified: true, isSuperAdmin: false } };

describe('api client', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    tokens.set(null);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends the bearer token and workspace header', async () => {
    tokens.set('abc');
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await api('/projects', { workspaceId: 'ws-1' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/v1/projects');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer abc', 'X-Workspace-Id': 'ws-1' });
  });

  it('shares one refresh request between concurrent callers', async () => {
    fetchMock.mockResolvedValue(json(200, session));
    const [a, b] = await Promise.all([refreshSession(), refreshSession()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a?.accessToken).toBe('fresh');
    expect(b).toBe(a);
    expect(tokens.get()).toBe('fresh');
  });

  it('refreshes once on 401 and retries the request', async () => {
    tokens.set('stale');
    fetchMock
      .mockResolvedValueOnce(json(401, { error: { code: 'UNAUTHENTICATED', message: 'expired' } }))
      .mockResolvedValueOnce(json(200, session))
      .mockResolvedValueOnce(json(200, [{ id: 'p1' }]));
    await new Promise((r) => setTimeout(r, 0)); // let any previous single-flight settle
    const result = await api<Array<{ id: string }>>('/projects');
    expect(result).toEqual([{ id: 'p1' }]);
    expect(fetchMock.mock.calls[1]![0]).toBe('/api/v1/auth/refresh');
    expect((fetchMock.mock.calls[2]![1]?.headers as Record<string, string>).Authorization).toBe('Bearer fresh');
  });

  it('ends the session when the refresh fails', async () => {
    tokens.set('stale');
    const expired = vi.fn();
    const off = tokens.onExpired(expired);
    fetchMock
      .mockResolvedValueOnce(json(401, { error: { code: 'UNAUTHENTICATED', message: 'expired' } }))
      .mockResolvedValueOnce(json(401, { error: { code: 'UNAUTHENTICATED', message: 'no session' } }));
    await new Promise((r) => setTimeout(r, 0));
    await expect(api('/projects')).rejects.toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalledOnce();
    expect(tokens.get()).toBeNull();
    off();
  });

  it('never refreshes a read-only impersonation token', async () => {
    tokens.set('imp', { readOnly: true });
    fetchMock.mockResolvedValueOnce(json(401, { error: { code: 'UNAUTHENTICATED', message: 'expired' } }));
    await expect(api('/projects')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('exposes error code, message and field errors', async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: { issues: [{ path: 'email', message: 'Bad email' }] } } }),
    );
    const err = await api('/auth/signup', { method: 'POST', body: {}, noRefresh: true }).catch((e) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('VALIDATION_FAILED');
    expect(err.fieldErrors).toEqual({ email: 'Bad email' });
  });

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(api('/members/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
