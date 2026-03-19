import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useInferenceServices,
  useInferenceService,
  useServiceMetrics,
  useCreateInferenceService,
  useDeleteInferenceService,
} from '../useInferenceServices';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useInferenceServices', () => {
  it('fetches inference services list', async () => {
    const { result } = renderHook(() => useInferenceServices(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

describe('useInferenceService', () => {
  it('fetches a single inference service by name', async () => {
    const { result } = renderHook(() => useInferenceService('fraud-detector'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.name).toBe('fraud-detector');
  });

  it('does not fetch when name is undefined', () => {
    const { result } = renderHook(() => useInferenceService(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useServiceMetrics', () => {
  it('fetches service metrics by name', async () => {
    const { result } = renderHook(() => useServiceMetrics('fraud-detector'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.metrics).toBeDefined();
    expect(result.current.data?.metrics.rps).toBeTypeOf('number');
  });

  it('does not fetch when name is undefined', () => {
    const { result } = renderHook(() => useServiceMetrics(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateInferenceService', () => {
  it('creates an inference service', async () => {
    const { result } = renderHook(() => useCreateInferenceService(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'new-model',
      framework: 'sklearn',
      storageUri: 'gs://bucket/model',
    } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});

describe('useDeleteInferenceService', () => {
  it('deletes an inference service', async () => {
    const { result } = renderHook(() => useDeleteInferenceService(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('fraud-detector');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
