import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './api';

export interface DashboardSession {
  id: string;
  mode: string;
  started_at: string;
  finished_at: string;
  duration_ms: number | null;
  wpm: string | number | null;
  accuracy: string | number | null;
}

export interface DashboardKeyStat {
  key: string;
  presses: number | string;
  errors: number | string;
  total_latency_ms: number | string;
  updated_at: string;
}

export interface DashboardData {
  sessions: DashboardSession[];
  keyStats: DashboardKeyStat[];
}

export function useDashboard(enabled: boolean) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    enabled,
    queryFn: async () => {
      const res = await apiFetch('/api/dashboard');
      if (!res.ok) {
        throw new Error(`dashboard fetch failed: ${res.status}`);
      }
      return (await res.json()) as DashboardData;
    },
    refetchOnMount: 'always',
  });
}
