import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSSE } from '@/hooks/useSSE';

class MockEventSource {
  static instances: MockEventSource[] = [];
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  url: string;
  close = vi.fn();
  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }
  emit(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }
}

describe('useSSE', () => {
  beforeEach(() => {
    vi.stubGlobal('EventSource', MockEventSource);
    MockEventSource.instances = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates EventSource with the given URL', () => {
    const url = 'https://api.example.com/sse';
    renderHook(() => useSSE(url));
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe(url);
  });

  it('updates data on message', async () => {
    const url = 'https://api.example.com/sse';
    const { result } = renderHook(() => useSSE<{ value: number }>(url));
    expect(result.current.data).toBeNull();

    await act(() => {
      MockEventSource.instances[0].emit({ value: 42 });
    });
    expect(result.current.data).toEqual({ value: 42 });
  });

  it('closes EventSource on unmount', () => {
    const url = 'https://api.example.com/sse';
    const { unmount } = renderHook(() => useSSE(url));
    expect(MockEventSource.instances[0].close).not.toHaveBeenCalled();
    unmount();
    expect(MockEventSource.instances[0].close).toHaveBeenCalled();
  });

  it('returns null data when url is null', () => {
    const { result } = renderHook(() => useSSE(null));
    expect(result.current.data).toBeNull();
    expect(MockEventSource.instances).toHaveLength(0);
  });
});
