import { useCallback, useEffect, useRef, useState } from 'react';

type Status = 'connecting' | 'open' | 'closed' | 'error';

export function useWebSocket<T>(url: string | null) {
  const [messages, setMessages] = useState<T[]>([]);
  const [status, setStatus] = useState<Status>('closed');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (!url) return;
    setStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatus('open');
    ws.onclose = () => {
      setStatus('closed');
      reconnectTimer.current = setTimeout(
        connect,
        Math.min(30_000, 1_000 * Math.random() * 5)
      );
    };
    ws.onerror = () => setStatus('error');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data) as T;
      setMessages((prev) => [...prev.slice(-9999), msg]);
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { messages, status, send: (data: string) => wsRef.current?.send(data) };
}
