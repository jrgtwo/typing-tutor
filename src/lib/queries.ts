import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';
import type { Plan } from './plan';
import type { SamplePassage } from '@/data/samplePassages';
import type { ModeId } from '@/engine/types';

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

export type RaccoonFrequency = 'chatty' | 'normal' | 'rare' | 'off';

export interface ProfilePreferences {
  raccoonFrequency?: RaccoonFrequency;
  [key: string]: unknown;
}

export interface Profile {
  id: string;
  display_name: string | null;
  plan: Plan;
  plan_expires_at: string | null;
  preferences: ProfilePreferences;
  created_at: string;
}

export const profileQueryKey = ['profile'] as const;

export function useProfile(enabled: boolean) {
  return useQuery<Profile>({
    queryKey: profileQueryKey,
    enabled,
    queryFn: async () => {
      const res = await apiFetch('/api/profile');
      if (!res.ok) {
        throw new Error(`profile fetch failed: ${res.status}`);
      }
      return (await res.json()) as Profile;
    },
    staleTime: 30_000,
  });
}

export interface ProfileUpdate {
  displayName?: string | null;
  preferences?: ProfilePreferences;
}

interface ContentItemRow {
  id: string;
  type: ModeId;
  title: string;
  body: string;
  source: string | null;
  language: string | null;
}

/**
 * Public catalog of typing passages from the DB. No auth header is
 * attached — `/api/content` is a public GET. Returns null on error so
 * callers can fall back to the local sample list without surfacing a
 * spinner or error UI.
 */
export function useContent() {
  return useQuery<SamplePassage[]>({
    queryKey: ['content'],
    queryFn: async () => {
      const res = await fetch('/api/content');
      if (!res.ok) {
        throw new Error(`content fetch failed: ${res.status}`);
      }
      const data = (await res.json()) as { items: ContentItemRow[] };
      return data.items.map(rowToPassage);
    },
    // Content rarely changes; an hour is plenty.
    staleTime: 60 * 60_000,
    retry: 1,
  });
}

function rowToPassage(row: ContentItemRow): SamplePassage {
  return {
    id: row.id,
    modeId: row.type,
    title: row.title,
    body: row.body,
    source: row.source ?? undefined,
  };
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<Profile, Error, ProfileUpdate>({
    mutationFn: async (body) => {
      const res = await apiFetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`profile update failed: ${res.status}`);
      }
      return (await res.json()) as Profile;
    },
    onSuccess: (next) => {
      qc.setQueryData(profileQueryKey, next);
    },
  });
}
