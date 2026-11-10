import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Loads a fresh copy of the module so it reads the stubbed VITE_API_URL
async function loadApi() {
  vi.resetModules();
  return import('./taskApi');
}

// Builds a JWT-shaped token whose payload carries the given claims
function makeToken(claims) {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode(claims)}.signature`;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function saveSession() {
  localStorage.setItem('taskflow_token', 'token-123');
  localStorage.setItem('taskflow_user', JSON.stringify({ name: 'Divya', email: 'd@x.com' }));
}

describe('taskApi', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'http://api.test/api/tasks');
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('roleFromToken', () => {
    it('reads the role from the token payload', async () => {
      const { roleFromToken } = await loadApi();

      expect(roleFromToken(makeToken({ sub: 'x', role: 'ADMIN' }))).toBe('ADMIN');
    });

    it('defaults to USER when the role is missing', async () => {
      const { roleFromToken } = await loadApi();

      expect(roleFromToken(makeToken({ sub: 'x' }))).toBe('USER');
    });

    it('defaults to USER when the token is malformed', async () => {
      const { roleFromToken } = await loadApi();

      expect(roleFromToken('not-a-token')).toBe('USER');
    });
  });

  describe('session', () => {
    it('returns null when nothing is stored', async () => {
      const { session } = await loadApi();

      expect(session.get()).toBeNull();
    });

    it('returns the saved token and user', async () => {
      const { session } = await loadApi();

      session.save({ token: 'token-123', name: 'Divya', email: 'd@x.com' });

      expect(session.get()).toEqual({
        token: 'token-123',
        user: { name: 'Divya', email: 'd@x.com' },
      });
    });

    it('clears the token and user', async () => {
      const { session } = await loadApi();
      session.save({ token: 'token-123', name: 'Divya', email: 'd@x.com' });

      session.clear();

      expect(session.get()).toBeNull();
    });
  });

  describe('requests', () => {
    it('builds the task list URL with search and priority', async () => {
      const { taskApi } = await loadApi();
      fetch.mockResolvedValueOnce(jsonResponse({ content: [] }));

      await taskApi.list({ search: '  milk  ', priority: 'HIGH' });

      expect(fetch.mock.calls[0][0]).toBe(
        'http://api.test/api/tasks?size=100&search=milk&priority=HIGH',
      );
    });

    it('leaves search and priority out when they are empty', async () => {
      const { taskApi } = await loadApi();
      fetch.mockResolvedValueOnce(jsonResponse({ content: [] }));

      await taskApi.list({ search: '   ', priority: '' });

      expect(fetch.mock.calls[0][0]).toBe('http://api.test/api/tasks?size=100');
    });

    it('sends the bearer token when a session exists', async () => {
      const { taskApi } = await loadApi();
      saveSession();
      fetch.mockResolvedValueOnce(jsonResponse({ content: [] }));

      await taskApi.list();

      const headers = fetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer token-123');
    });

    it('sends no Authorization header without a session', async () => {
      const { taskApi } = await loadApi();
      fetch.mockResolvedValueOnce(jsonResponse({ content: [] }));

      await taskApi.list();

      const headers = fetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });

    it('throws the error message from the response body', async () => {
      const { taskApi } = await loadApi();
      fetch.mockResolvedValueOnce(jsonResponse({ error: 'Title is required' }, 400));

      await expect(taskApi.create({ title: '' })).rejects.toThrow('Title is required');
    });

    it('falls back to a status message when the body has no JSON', async () => {
      const { taskApi } = await loadApi();
      fetch.mockResolvedValueOnce(new Response('oops', { status: 500 }));

      await expect(taskApi.list()).rejects.toThrow('Request failed (500)');
    });

    it('returns null for a 204 response', async () => {
      const { taskApi } = await loadApi();
      fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      await expect(taskApi.remove('task-1')).resolves.toBeNull();
    });

    it('clears the session and announces expiry when a saved token is rejected', async () => {
      const { taskApi, session } = await loadApi();
      saveSession();
      const onExpired = vi.fn();
      window.addEventListener('session-expired', onExpired);
      fetch.mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, 401));

      await expect(taskApi.list()).rejects.toThrow('Unauthorized');

      expect(session.get()).toBeNull();
      expect(onExpired).toHaveBeenCalledTimes(1);
      window.removeEventListener('session-expired', onExpired);
    });
  });
});
