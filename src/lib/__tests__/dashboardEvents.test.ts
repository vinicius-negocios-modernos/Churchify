import { describe, it, expect, vi } from 'vitest';
import {
  DASHBOARD_REFRESH_EVENT,
  emitDashboardRefresh,
  onDashboardRefresh,
} from '@/lib/dashboardEvents';

describe('dashboardEvents', () => {
  it('exports the correct event name', () => {
    expect(DASHBOARD_REFRESH_EVENT).toBe('churchify:dashboard-refresh');
  });

  it('emitDashboardRefresh dispatches a CustomEvent on window', () => {
    const listener = vi.fn();
    window.addEventListener(DASHBOARD_REFRESH_EVENT, listener);

    emitDashboardRefresh();

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0]).toBeInstanceOf(CustomEvent);

    window.removeEventListener(DASHBOARD_REFRESH_EVENT, listener);
  });

  it('onDashboardRefresh registers a callback and returns unsubscribe function', () => {
    const callback = vi.fn();
    const unsubscribe = onDashboardRefresh(callback);

    emitDashboardRefresh();
    expect(callback).toHaveBeenCalledOnce();

    // Unsubscribe
    unsubscribe();

    emitDashboardRefresh();
    // Should still be 1, not 2
    expect(callback).toHaveBeenCalledOnce();
  });

  it('supports multiple listeners', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const unsub1 = onDashboardRefresh(cb1);
    const unsub2 = onDashboardRefresh(cb2);

    emitDashboardRefresh();

    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();

    unsub1();
    unsub2();
  });
});
