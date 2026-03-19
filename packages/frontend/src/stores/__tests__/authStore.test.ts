import { describe, expect, it, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  });

  it('initial state has isAuthenticated false', () => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('login sets user and tokens', () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test', groups: ['admin'] };
    const tokens = { accessToken: 'access-123', refreshToken: 'refresh-456' };

    useAuthStore.getState().login(tokens, user);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().accessToken).toBe('access-123');
    expect(useAuthStore.getState().refreshToken).toBe('refresh-456');
  });

  it('logout clears state', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com', name: 'Test', groups: ['admin'] },
      accessToken: 'fake',
      refreshToken: 'fake',
    });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('setTokens updates tokens', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com', name: 'Test', groups: ['admin'] },
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
    });

    useAuthStore.getState().setTokens({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    expect(useAuthStore.getState().accessToken).toBe('new-access');
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh');
  });
});
