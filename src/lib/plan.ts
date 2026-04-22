/**
 * Capability gating. The rest of the app calls `can(profile, 'something')`
 * instead of checking `plan === 'pro'` directly. To add tiers later, edit
 * the CAPABILITIES table — no other file needs to change.
 *
 * Both monetization paths flow through here:
 *  - subscription tiers (`profile.plan === 'pro'`) unlock paid capabilities
 *  - display ads check `can(profile, 'ads.hidden')` to know whether to render
 */

export type Plan = 'free' | 'pro' | 'power';

export type Capability =
  | 'analytics.heatmap'
  | 'analytics.session_history'
  | 'analytics.keystroke_replay'
  | 'content.unlimited'
  | 'ads.hidden'
  | 'raccoon.dynamic';

export interface PlanProfile {
  plan: Plan;
  plan_expires_at: string | null;
}

// In v1 every user is on `free` and the only thing gated is keystroke replay
// (the writer is off until paid tiers ship). Edit this table when tiers land.
const CAPABILITIES: Record<Plan, Record<Capability, boolean>> = {
  free: {
    'analytics.heatmap': true,
    'analytics.session_history': true,
    'analytics.keystroke_replay': false,
    'content.unlimited': true,
    'ads.hidden': false,
    'raccoon.dynamic': false,
  },
  pro: {
    'analytics.heatmap': true,
    'analytics.session_history': true,
    'analytics.keystroke_replay': true,
    'content.unlimited': true,
    'ads.hidden': true,
    'raccoon.dynamic': false,
  },
  power: {
    'analytics.heatmap': true,
    'analytics.session_history': true,
    'analytics.keystroke_replay': true,
    'content.unlimited': true,
    'ads.hidden': true,
    'raccoon.dynamic': true,
  },
};

export function can(profile: PlanProfile | null | undefined, capability: Capability): boolean {
  const plan: Plan = profile?.plan ?? 'free';
  const expired =
    profile?.plan_expires_at != null && new Date(profile.plan_expires_at) < new Date();
  const effective: Plan = expired ? 'free' : plan;
  return CAPABILITIES[effective]?.[capability] ?? false;
}
