import type { SessionMode } from './types';

const REGISTRY = new Map<string, SessionMode<any, any>>();
const ORDER: string[] = [];

export function registerMode<TState, TConfig>(mode: SessionMode<TState, TConfig>): void {
  if (REGISTRY.has(mode.id)) {
    if (import.meta.env.DEV) {
      console.warn(`[modes] duplicate registration ignored: ${mode.id}`);
    }
    return;
  }
  REGISTRY.set(mode.id, mode as SessionMode<any, any>);
  ORDER.push(mode.id);
}

export function getMode(id: string): SessionMode<any, any> | undefined {
  return REGISTRY.get(id);
}

export function listModes(): SessionMode<any, any>[] {
  return ORDER.map((id) => REGISTRY.get(id)!).filter(Boolean);
}

export function hasMode(id: string): boolean {
  return REGISTRY.has(id);
}
