import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFlows, useFlowRuns, useCancelFlowRun } from '../useFlows';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useFlows', () => {
  it('fetches flows list', async () => {
    const { result } = renderHook(() => useFlows(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
  });
});

describe('useFlowRuns', () => {
  it('fetches flow runs', async () => {
    const { result } = renderHook(() => useFlowRuns('flow-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('fetches all runs when no flowId provided', async () => {
    const { result } = renderHook(() => useFlowRuns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

describe('useCancelFlowRun', () => {
  it('cancels a flow run', async () => {
    const { result } = renderHook(() => useCancelFlowRun(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('run-123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
