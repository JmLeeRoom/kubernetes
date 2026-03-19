import { NavLink } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Box,
  FileText,
  FlaskConical,
  GitBranch,
  Layers,
  LayoutDashboard,
  Radio,
  Server,
  Workflow,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

const navGroups = [
  {
    label: 'Monitoring',
    items: [
      { to: '/monitoring/cluster', label: 'Cluster', icon: Server },
      { to: '/monitoring/metrics', label: 'Metrics', icon: BarChart3 },
      { to: '/monitoring/logs', label: 'Logs', icon: FileText },
      { to: '/monitoring/traces', label: 'Traces', icon: Activity },
      { to: '/monitoring/alerts', label: 'Alerts', icon: Zap },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { to: '/pipeline/connections', label: 'Connections', icon: Radio },
      { to: '/pipeline/flows', label: 'Flows', icon: Workflow },
      { to: '/pipeline/jobs', label: 'Spark Jobs', icon: Layers },
    ],
  },
  {
    label: 'Serving',
    items: [
      { to: '/serving/models', label: 'Models', icon: Box },
      { to: '/serving/deploy', label: 'Deploy', icon: LayoutDashboard },
      { to: '/serving/traffic', label: 'Traffic', icon: GitBranch },
    ],
  },
  {
    label: 'MLOps',
    items: [
      { to: '/mlops/experiments', label: 'Experiments', icon: FlaskConical },
      { to: '/mlops/registry', label: 'Registry', icon: Box },
      { to: '/mlops/pipelines', label: 'DAGs', icon: Workflow },
    ],
  },
];

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <span className="text-lg font-semibold text-foreground">MLOps</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2" role="navigation">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
