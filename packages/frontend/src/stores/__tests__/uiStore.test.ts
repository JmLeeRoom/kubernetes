import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from '@/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarCollapsed: false,
      theme: 'system',
      timeRange: { from: 'now-1h', to: 'now', preset: '1h' },
    });
  });

  it('initial state has sidebarCollapsed false', () => {
    const state = useUIStore.getState();
    expect(state.sidebarCollapsed).toBe(false);
  });

  it('toggleSidebar flips sidebarCollapsed', () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('setTheme updates theme', () => {
    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('setTimeRange updates timeRange', () => {
    const newRange = { from: 'now-24h', to: 'now', preset: '24h' };
    useUIStore.getState().setTimeRange(newRange);
    expect(useUIStore.getState().timeRange).toEqual(newRange);
  });
});
