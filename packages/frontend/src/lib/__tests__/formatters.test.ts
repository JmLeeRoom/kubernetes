import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatCPU,
  formatDuration,
  formatNumber,
  formatRelativeTime,
} from '@/lib/formatters';

describe('formatters', () => {
  describe('formatBytes', () => {
    it('returns "0 B" for 0', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('returns "1.0 KiB" for 1024', () => {
      expect(formatBytes(1024)).toBe('1.0 KiB');
    });

    it('returns "1.0 MiB" for 1048576', () => {
      expect(formatBytes(1048576)).toBe('1.0 MiB');
    });
  });

  describe('formatDuration', () => {
    it('returns "500ms" for 500', () => {
      expect(formatDuration(500)).toBe('500ms');
    });

    it('returns "1h" for 3600000', () => {
      expect(formatDuration(3600000)).toBe('1h');
    });

    it('returns "1m 30s" for 90000', () => {
      expect(formatDuration(90000)).toBe('1m 30s');
    });
  });

  describe('formatNumber', () => {
    it('returns "1,234.57" for 1234.567', () => {
      expect(formatNumber(1234.567)).toBe('1,234.57');
    });
  });

  describe('formatCPU', () => {
    it('returns "100m" for 100', () => {
      expect(formatCPU(100)).toBe('100m');
    });

    it('returns "2.0 cores" for 2000', () => {
      expect(formatCPU(2000)).toBe('2.0 cores');
    });

    it('returns "1.0 cores" for exactly 1000', () => {
      expect(formatCPU(1000)).toBe('1.0 cores');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns "just now" for future dates', () => {
      const future = new Date(Date.now() + 60_000);
      expect(formatRelativeTime(future)).toBe('just now');
    });

    it('returns seconds ago for < 60s', () => {
      const past = new Date(Date.now() - 30_000);
      expect(formatRelativeTime(past)).toBe('30s ago');
    });

    it('returns minutes ago for < 1h', () => {
      const past = new Date(Date.now() - 5 * 60_000);
      expect(formatRelativeTime(past)).toBe('5m ago');
    });

    it('returns hours ago for < 24h', () => {
      const past = new Date(Date.now() - 3 * 3_600_000);
      expect(formatRelativeTime(past)).toBe('3h ago');
    });

    it('returns days ago for >= 24h', () => {
      const past = new Date(Date.now() - 2 * 86_400_000);
      expect(formatRelativeTime(past)).toBe('2d ago');
    });

    it('accepts string date input', () => {
      const past = new Date(Date.now() - 120_000).toISOString();
      expect(formatRelativeTime(past)).toBe('2m ago');
    });

    it('accepts numeric timestamp input', () => {
      const past = Date.now() - 7200_000;
      expect(formatRelativeTime(past)).toBe('2h ago');
    });
  });

  describe('formatDuration edge cases', () => {
    it('returns "1d" for exactly 86400000', () => {
      expect(formatDuration(86400000)).toBe('1d');
    });

    it('returns "1d 2h 3m" for combined duration', () => {
      const ms = (86400 + 7200 + 180) * 1000;
      expect(formatDuration(ms)).toBe('1d 2h 3m');
    });

    it('returns "0s" for exactly 1000ms with no other parts', () => {
      expect(formatDuration(1000)).toBe('1s');
    });
  });

  describe('formatBytes edge cases', () => {
    it('handles negative bytes', () => {
      const result = formatBytes(-1024);
      expect(result).toBe('-1.0 KiB');
    });

    it('handles custom decimal precision', () => {
      expect(formatBytes(1536, 2)).toBe('1.50 KiB');
    });
  });
});
