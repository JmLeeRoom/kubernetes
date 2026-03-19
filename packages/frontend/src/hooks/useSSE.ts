import { useEffect, useRef, useState } from 'react';

interface UseSSEOptions {
  onMessage?: (data: unknown) => void;
  onError?: (event: Event) => void;
}

export function useSSE<T>(url: string | null, options: UseSSEOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const onMessageRef = useRef(options.onMessage);
  const onErrorRef = useRef(options.onError);

  onMessageRef.current = options.onMessage;
  onErrorRef.current = options.onError;

  useEffect(() => {
    if (!url) return;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      const parsed = JSON.parse(e.data) as T;
      setData(parsed);
      onMessageRef.current?.(parsed);
    };
    es.onerror = (e) => {
      setError(e);
      onErrorRef.current?.(e);
    };

    return () => es.close();
  }, [url]);

  return { data, error, close: () => esRef.current?.close() };
}
