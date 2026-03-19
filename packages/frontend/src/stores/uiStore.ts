import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
interface TimeRange {
  from: string;
  to: string;
  preset: string;
}

interface UIStore {
  sidebarCollapsed: boolean;
  theme: Theme;
  timeRange: TimeRange;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  setTimeRange: (range: TimeRange) => void;
}

const defaultTimeRange: TimeRange = {
  from: 'now-1h',
  to: 'now',
  preset: '1h',
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'system',
      timeRange: defaultTimeRange,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setTimeRange: (timeRange) => set({ timeRange }),
    }),
    { name: 'mlops-ui' }
  )
);
