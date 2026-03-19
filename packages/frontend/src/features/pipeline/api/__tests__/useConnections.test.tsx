import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useConnections, useConnectionJobs, useTriggerSync } from '../useConnections';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useConnections', () => {
  it('fetches connections list', async () => {
    const { result } = renderHook(() => useConnections(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
  });
});

describe('useConnectionJobs', () => {
  it('fetches jobs for a connection', async () => {
    const { result } = renderHook(() => useConnectionJobs('conn-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('does not fetch when connectionId is undefined', () => {
    const { result } = renderHook(() => useConnectionJobs(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useTriggerSync', () => {
  it('triggers a sync for a connection', async () => {
    const { result } = renderHook(() => useTriggerSync(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('conn-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
