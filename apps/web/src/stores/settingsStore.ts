import { create } from "zustand";

type SettingsState = {
  topK: number;
  setTopK: (v: number) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  topK: 4,
  setTopK: (v) => set({ topK: Math.max(1, Math.min(10, v)) }),
}));
