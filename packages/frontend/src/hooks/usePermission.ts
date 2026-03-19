import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

type Resource = 'monitoring' | 'pipeline' | 'serving' | 'mlops' | 'settings';
type Action = 'read' | 'write' | 'admin';

const ROLE_PERMISSIONS: Record<string, Record<Resource, Set<Action>>> = {
  admin: {
    monitoring: new Set(['read', 'write', 'admin']),
    pipeline: new Set(['read', 'write', 'admin']),
    serving: new Set(['read', 'write', 'admin']),
    mlops: new Set(['read', 'write', 'admin']),
    settings: new Set(['read', 'write', 'admin']),
  },
  'ml-engineer': {
    monitoring: new Set(['read']),
    pipeline: new Set(['read']),
    serving: new Set(['read', 'write']),
    mlops: new Set(['read', 'write']),
    settings: new Set(['read']),
  },
  'data-engineer': {
    monitoring: new Set(['read']),
    pipeline: new Set(['read', 'write']),
    serving: new Set(['read']),
    mlops: new Set(['read']),
    settings: new Set(['read']),
  },
  viewer: {
    monitoring: new Set(['read']),
    pipeline: new Set(['read']),
    serving: new Set(['read']),
    mlops: new Set(['read']),
    settings: new Set(['read']),
  },
};

function resolveRole(groups: string[]): string {
  if (groups.includes('admin')) return 'admin';
  if (groups.includes('ml-engineer')) return 'ml-engineer';
  if (groups.includes('data-engineer')) return 'data-engineer';
  return 'viewer';
}

export function usePermission(resource: Resource, action: Action): { allowed: boolean } {
  const groups = useAuthStore((s) => s.user?.groups ?? []);

  const allowed = useMemo(() => {
    const role = resolveRole(groups);
    const perms = ROLE_PERMISSIONS[role]?.[resource];
    return perms?.has(action) ?? false;
  }, [groups, resource, action]);

  return { allowed };
}
