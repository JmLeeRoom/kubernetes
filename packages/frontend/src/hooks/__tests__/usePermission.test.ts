import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermission } from '../usePermission';
import { useAuthStore } from '@/stores/authStore';

describe('usePermission', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('returns allowed=true for admin on any resource/action', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@test.com', name: 'Admin', groups: ['admin'] },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission('monitoring', 'admin'));
    expect(result.current.allowed).toBe(true);
  });

  it('returns allowed=true for admin write on settings', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@test.com', name: 'Admin', groups: ['admin'] },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission('settings', 'write'));
    expect(result.current.allowed).toBe(true);
  });

  it('returns allowed=true for ml-engineer write on serving', () => {
    useAuthStore.setState({
      user: { id: '2', email: 'ml@test.com', name: 'ML', groups: ['ml-engineer'] },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission('serving', 'write'));
    expect(result.current.allowed).toBe(true);
  });

  it('returns allowed=false for ml-engineer write on pipeline', () => {
    useAuthStore.setState({
      user: { id: '2', email: 'ml@test.com', name: 'ML', groups: ['ml-engineer'] },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission('pipeline', 'write'));
    expect(result.current.allowed).toBe(false);
  });

  it('returns allowed=true for data-engineer write on pipeline', () => {
    useAuthStore.setState({
      user: { id: '3', email: 'de@test.com', name: 'DE', groups: ['data-engineer'] },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission('pipeline', 'write'));
    expect(result.current.allowed).toBe(true);
  });

  it('returns allowed=false for data-engineer write on serving', () => {
    useAuthStore.setState({
      user: { id: '3', email: 'de@test.com', name: 'DE', groups: ['data-engineer'] },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission('serving', 'write'));
    expect(result.current.allowed).toBe(false);
  });

  it('returns allowed=true for viewer read on any resource', () => {
    useAuthStore.setState({
      user: { id: '4', email: 'v@test.com', name: 'Viewer', groups: ['viewer'] },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission('monitoring', 'read'));
    expect(result.current.allowed).toBe(true);
  });

  it('returns allowed=false for viewer write on any resource', () => {
    useAuthStore.setState({
      user: { id: '4', email: 'v@test.com', name: 'Viewer', groups: ['viewer'] },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission('monitoring', 'write'));
    expect(result.current.allowed).toBe(false);
  });

  it('defaults to viewer when user has no groups', () => {
    useAuthStore.setState({
      user: { id: '5', email: 'n@test.com', name: 'NoGroup', groups: [] },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission('monitoring', 'read'));
    expect(result.current.allowed).toBe(true);

    const { result: result2 } = renderHook(() => usePermission('monitoring', 'write'));
    expect(result2.current.allowed).toBe(false);
  });

  it('defaults to viewer when user is null', () => {
    const { result } = renderHook(() => usePermission('monitoring', 'read'));
    expect(result.current.allowed).toBe(true);

    const { result: result2 } = renderHook(() => usePermission('monitoring', 'admin'));
    expect(result2.current.allowed).toBe(false);
  });

  it('admin group takes priority when user has multiple groups', () => {
    useAuthStore.setState({
      user: { id: '6', email: 'a@test.com', name: 'Multi', groups: ['ml-engineer', 'admin'] },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermission('settings', 'admin'));
    expect(result.current.allowed).toBe(true);
  });
});
