import { DashboardShellInner } from './dashboard-shell-inner';

/** Server entry — delegates to one client boundary for selection context. */
export function DashboardShell() {
  return <DashboardShellInner />;
}
