/**
 * Custom event bus for dashboard refresh after episode creation.
 * Uses window CustomEvent to decouple NewEpisode from Dashboard.
 */

export const DASHBOARD_REFRESH_EVENT = 'churchify:dashboard-refresh';

export function emitDashboardRefresh(): void {
  window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
}

export function onDashboardRefresh(callback: () => void): () => void {
  window.addEventListener(DASHBOARD_REFRESH_EVENT, callback);
  return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, callback);
}
