import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatCPU,
  formatDuration,
  formatNumber,
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
  });
});
