import { create } from 'zustand';
import { initialState, reduce } from './reducer';
import type { EngineEvent, EngineState, ModeId } from './types';

interface EngineStore extends EngineState {
  load: (modeId: ModeId, rawTarget: string) => void;
  dispatch: (event: EngineEvent) => void;
}

export const useEngineStore = create<EngineStore>((set) => ({
  ...initialState('prose', ''),
  load: (modeId, rawTarget) => set(initialState(modeId, rawTarget)),
  dispatch: (event) => set((s) => reduce(s, event)),
}));
