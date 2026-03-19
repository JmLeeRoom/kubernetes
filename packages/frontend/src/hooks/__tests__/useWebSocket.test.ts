import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWebSocket } from '@/hooks/useWebSocket';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  url: string;
  close = vi.fn();
  send = vi.fn();
  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => this.onopen?.(), 0);
  }
}

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    MockWebSocket.instances = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates WebSocket with given URL', () => {
    const url = 'wss://api.example.com/ws';
    renderHook(() => useWebSocket(url));
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe(url);
  });

  it('collects messages', async () => {
    const url = 'wss://api.example.com/ws';
    const { result } = renderHook(() => useWebSocket<{ id: number }>(url));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.messages).toEqual([]);

    await act(() => {
      MockWebSocket.instances[0].onmessage?.(
        new MessageEvent('message', { data: JSON.stringify({ id: 1 }) })
      );
    });
    expect(result.current.messages).toEqual([{ id: 1 }]);

    await act(() => {
      MockWebSocket.instances[0].onmessage?.(
        new MessageEvent('message', { data: JSON.stringify({ id: 2 }) })
      );
    });
    expect(result.current.messages).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("returns status 'closed' initially then 'open' after connect", async () => {
    const url = 'wss://api.example.com/ws';
    const { result } = renderHook(() => useWebSocket(url));
    expect(result.current.status).toBe('connecting');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.status).toBe('open');
  });
});
