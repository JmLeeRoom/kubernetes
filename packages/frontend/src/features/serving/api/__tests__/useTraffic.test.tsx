import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCanaryStatus, useUpdateTraffic } from '../useTraffic';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useCanaryStatus', () => {
  it('fetches canary status for a named service', async () => {
    const { result } = renderHook(() => useCanaryStatus('fraud-detector'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.name).toBe('fraud-detector');
  });

  it('does not fetch when name is undefined', () => {
    const { result } = renderHook(() => useCanaryStatus(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useUpdateTraffic', () => {
  it('updates traffic split', async () => {
    const { result } = renderHook(() => useUpdateTraffic(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'fraud-detector', canaryPercent: 30 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
