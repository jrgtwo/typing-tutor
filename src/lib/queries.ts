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

export interface AdminContentItem {
  id: string;
  type: ModeId;
  title: string;
  body: string;
  language: string | null;
  source: string | null;
  difficulty: number;
  length_chars: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminContentInput {
  type: ModeId;
  title: string;
  body: string;
  language?: string | null;
  source?: string | null;
  difficulty?: number;
  isActive?: boolean;
}

export type AdminContentPatch = Partial<AdminContentInput>;

export const adminContentQueryKey = ['admin', 'content'] as const;

export function useAdminContent(enabled: boolean) {
  return useQuery<AdminContentItem[]>({
    queryKey: adminContentQueryKey,
    enabled,
    queryFn: async () => {
      const res = await apiFetch('/api/admin/content');
      if (res.status === 403) throw new ForbiddenError();
      if (!res.ok) {
        throw new Error(`admin content fetch failed: ${res.status}`);
      }
      const data = (await res.json()) as { items: AdminContentItem[] };
      return data.items;
    },
    retry: (failureCount, err) => {
      if (err instanceof ForbiddenError) return false;
      return failureCount < 1;
    },
  });
}

export class ForbiddenError extends Error {
  constructor(message = 'forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function useCreateContent() {
  const qc = useQueryClient();
  return useMutation<AdminContentItem, Error, AdminContentInput>({
    mutationFn: async (input) => {
      const res = await apiFetch('/api/admin/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `create failed: ${res.status}`);
      }
      return (await res.json()) as AdminContentItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminContentQueryKey });
      qc.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useUpdateContent() {
  const qc = useQueryClient();
  return useMutation<
    AdminContentItem,
    Error,
    { id: string; patch: AdminContentPatch }
  >({
    mutationFn: async ({ id, patch }) => {
      const res = await apiFetch(`/api/admin/content/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `update failed: ${res.status}`);
      }
      return (await res.json()) as AdminContentItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminContentQueryKey });
      qc.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

// ── mode_configs ──────────────────────────────────────────────────────────
//
// Public read returns admin-edited overrides per (mode_id, difficulty). The
// orchestrator overlays these on top of each mode's code-level default
// difficulties to produce the effective config. Missing rows fall through to
// code defaults.

export interface ModeConfigRow {
  mode_id: string;
  difficulty: string;
  config: Record<string, unknown>;
}

export interface AdminModeConfigRow extends ModeConfigRow {
  id: number;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Indexed effective overrides: configs[modeId][difficulty] → Record<string, unknown>.
 * The orchestrator does `{ ...codeDefault, ...overrides[mode][diff] }` per
 * session start.
 */
export type ModeConfigsByMode = Record<string, Record<string, Record<string, unknown>>>;

function indexConfigs(rows: ModeConfigRow[]): ModeConfigsByMode {
  const out: ModeConfigsByMode = {};
  for (const r of rows) {
    if (!out[r.mode_id]) out[r.mode_id] = {};
    out[r.mode_id][r.difficulty] = r.config;
  }
  return out;
}

export const modeConfigsQueryKey = ['mode-configs'] as const;

export function useModeConfigs() {
  return useQuery<ModeConfigsByMode>({
    queryKey: modeConfigsQueryKey,
    queryFn: async () => {
      const res = await fetch('/api/mode-configs');
      if (!res.ok) throw new Error(`mode-configs fetch failed: ${res.status}`);
      const data = (await res.json()) as { items: ModeConfigRow[] };
      return indexConfigs(data.items);
    },
    // Configs change rarely; an hour is plenty.
    staleTime: 60 * 60_000,
    retry: 1,
  });
}

export const adminModeConfigsQueryKey = ['admin', 'mode-configs'] as const;

export function useAdminModeConfigs(enabled: boolean) {
  return useQuery<AdminModeConfigRow[]>({
    queryKey: adminModeConfigsQueryKey,
    enabled,
    queryFn: async () => {
      const res = await apiFetch('/api/admin/mode-configs');
      if (res.status === 403) throw new ForbiddenError();
      if (!res.ok) throw new Error(`admin mode-configs fetch failed: ${res.status}`);
      const data = (await res.json()) as { items: AdminModeConfigRow[] };
      return data.items;
    },
    retry: (failureCount, err) => {
      if (err instanceof ForbiddenError) return false;
      return failureCount < 1;
    },
  });
}

export function useUpdateModeConfig() {
  const qc = useQueryClient();
  return useMutation<
    AdminModeConfigRow,
    Error,
    { modeId: string; difficulty: string; config: Record<string, unknown> }
  >({
    mutationFn: async ({ modeId, difficulty, config }) => {
      const res = await apiFetch(
        `/api/admin/mode-configs/${encodeURIComponent(modeId)}/${encodeURIComponent(difficulty)}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ config }),
        },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `update failed: ${res.status}`);
      }
      return (await res.json()) as AdminModeConfigRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminModeConfigsQueryKey });
      qc.invalidateQueries({ queryKey: modeConfigsQueryKey });
    },
  });
}

export function useResetModeConfig() {
  const qc = useQueryClient();
  return useMutation<void, Error, { modeId: string; difficulty: string }>({
    mutationFn: async ({ modeId, difficulty }) => {
      const res = await apiFetch(
        `/api/admin/mode-configs/${encodeURIComponent(modeId)}/${encodeURIComponent(difficulty)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `delete failed: ${res.status}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminModeConfigsQueryKey });
      qc.invalidateQueries({ queryKey: modeConfigsQueryKey });
    },
  });
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
