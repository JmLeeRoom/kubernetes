import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/authStore';
import { api } from '../api';

describe('api client', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('has correct default config', () => {
    expect(api.defaults.baseURL).toBeDefined();
    expect(api.defaults.timeout).toBe(30_000);
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('attaches auth token to requests when available', async () => {
    let capturedAuth: string | undefined;

    server.use(
      http.get('/api/v1/test-auth', ({ request }) => {
        capturedAuth = request.headers.get('Authorization') ?? undefined;
        return HttpResponse.json({ ok: true });
      }),
    );

    useAuthStore.setState({ accessToken: 'my-test-token' });

    await api.get('/test-auth');
    expect(capturedAuth).toBe('Bearer my-test-token');
  });

  it('does not attach auth header when no token', async () => {
    let capturedAuth: string | null = null;

    server.use(
      http.get('/api/v1/test-no-auth', ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    await api.get('/test-no-auth');
    expect(capturedAuth).toBeNull();
  });

  it('passes through successful responses', async () => {
    server.use(
      http.get('/api/v1/test-success', () => {
        return HttpResponse.json({ message: 'hello' });
      }),
    );

    const response = await api.get('/test-success');
    expect(response.data).toEqual({ message: 'hello' });
  });

  it('rejects non-401 errors normally', async () => {
    server.use(
      http.get('/api/v1/test-500', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(api.get('/test-500')).rejects.toThrow();
  });

  it('attempts token refresh on 401 and retries request', async () => {
    let callCount = 0;

    server.use(
      http.get('/api/v1/test-refresh', () => {
        callCount++;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({ data: 'refreshed' });
      }),
      http.post('/api/v1/auth/refresh', () => {
        return HttpResponse.json({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        });
      }),
    );

    useAuthStore.setState({
      accessToken: 'old-token',
      refreshToken: 'old-refresh',
      isAuthenticated: true,
    });

    const response = await api.get('/test-refresh');
    expect(response.data).toEqual({ data: 'refreshed' });
    expect(callCount).toBe(2);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-access-token');
    expect(state.refreshToken).toBe('new-refresh-token');
  });

  it('rejects on 401 when _retry is already set (no infinite loop)', async () => {
    server.use(
      http.get('/api/v1/test-retry-guard', () => {
        return new HttpResponse(null, { status: 401 });
      }),
    );

    // Simulate a request that already retried
    await expect(
      api.get('/test-retry-guard', { headers: {}, _retry: true } as any)
    ).rejects.toThrow();
  });
});
