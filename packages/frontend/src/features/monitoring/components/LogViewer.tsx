import { useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import type { LogQueryResult } from '../types';

interface LogViewerProps {
  data: LogQueryResult | undefined;
  isLoading?: boolean;
}

interface FlatLog {
  timestamp: string;
  line: string;
  level: string;
}

function extractLevel(line: string): string {
  const lower = line.toLowerCase();
  if (lower.includes('error') || lower.includes('err')) return 'error';
  if (lower.includes('warn')) return 'warn';
  if (lower.includes('debug')) return 'debug';
  return 'info';
}

const LEVEL_COLORS: Record<string, string> = {
  error: 'text-red-500',
  warn: 'text-yellow-500',
  debug: 'text-gray-400',
  info: 'text-blue-400',
};

export function LogViewer({ data, isLoading }: LogViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const logs = useMemo<FlatLog[]>(() => {
    if (!data?.data?.result) return [];
    return data.data.result.flatMap((stream) =>
      stream.values.map(([ts, line]) => ({
        timestamp: new Date(Number(ts) / 1e6).toISOString(),
        line,
        level: extractLevel(line),
      }))
    );
  }, [data]);

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 20,
  });

  useEffect(() => {
    if (logs.length > 0) {
      virtualizer.scrollToIndex(logs.length - 1);
    }
  }, [logs.length, virtualizer]);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-lg bg-muted" />;
  }

  if (logs.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border text-sm text-muted-foreground">
        No logs found
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-96 overflow-auto rounded-lg border bg-black/90 font-mono text-xs"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((vRow) => {
          const log = logs[vRow.index];
          return (
            <div
              key={vRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${vRow.size}px`,
                transform: `translateY(${vRow.start}px)`,
              }}
              className="flex gap-2 px-2 leading-6 hover:bg-white/5"
            >
              <span className="shrink-0 text-gray-500">
                {log.timestamp.slice(11, 23)}
              </span>
              <span className={cn('w-12 shrink-0 uppercase', LEVEL_COLORS[log.level])}>
                {log.level}
              </span>
              <span className="truncate text-gray-200">{log.line}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
