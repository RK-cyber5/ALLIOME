"use client";

/**
 * ALLIOME workspace store (zustand + localStorage persistence).
 *
 * Holds the analysis index (so investigations survive refresh), the active
 * analysis id used by discovery/portfolio/activation/reports, per-task
 * completion in activation roadmaps, and demo preferences.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AnalysisBrief, AnalysisStatus } from "./api/types";
import { SEED_ANALYSIS_ID } from "./api/demo-partners";
import { STORAGE_KEYS, migrateStorageKeys } from "./api/storage-keys";
import { IS_DEMO } from "./api/client";

// One-shot migration of legacy `pp.*` keys to the `alliome.*` namespace.
// Runs on the client before the persisted store initialises.
migrateStorageKeys();

export interface AnalysisIndexEntry {
  id: string;
  /** Display title, e.g. "Aivera — Aivera Flow · Germany & DACH". */
  title: string;
  company: string;
  product: string;
  geography: string;
  industry: string;
  status: AnalysisStatus;
  createdAt: string;
  demo: boolean;
}

export type SimulateMode = "none" | "fail" | "partial";

interface WorkspaceState {
  analyses: AnalysisIndexEntry[];
  activeAnalysisId: string | null;
  /** roadmap task completions: analysisId → taskId → done */
  taskCompletions: Record<string, Record<string, boolean>>;
  simulate: SimulateMode;

  setActive: (id: string | null) => void;
  upsertAnalysis: (entry: AnalysisIndexEntry) => void;
  updateStatus: (id: string, status: AnalysisStatus) => void;
  removeAnalysis: (id: string) => void;
  toggleTask: (analysisId: string, taskId: string) => void;
  setSimulate: (mode: SimulateMode) => void;
  resetAll: () => void;
}

export function entryFromBrief(id: string, brief: AnalysisBrief, status: AnalysisStatus, demo: boolean): AnalysisIndexEntry {
  return {
    id,
    title: `${brief.company.name || "Untitled"} — ${brief.company.product_name || "Product"} · ${brief.target_market.geography || "market"}`,
    company: brief.company.name,
    product: brief.company.product_name,
    geography: brief.target_market.geography,
    industry: brief.target_market.industry,
    status,
    createdAt: new Date().toISOString(),
    demo,
  };
}

const SEED_ENTRY: AnalysisIndexEntry = {
  id: SEED_ANALYSIS_ID,
  title: "Aivera — Aivera Flow · Germany & DACH",
  company: "Aivera",
  product: "Aivera Flow",
  geography: "Germany & DACH",
  industry: "Discrete manufacturing",
  status: "completed",
  createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
  demo: true,
};

/**
 * In live mode the workspace starts empty — no fabricated investigation
 * history. The seeded demo entry only exists in mock mode (local dev &
 * automated tests), where every record is labelled demo data.
 */
const initialAnalyses = (): AnalysisIndexEntry[] => (IS_DEMO ? [SEED_ENTRY] : []);
const initialActiveId = (): string | null => (IS_DEMO ? SEED_ANALYSIS_ID : null);

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      analyses: initialAnalyses(),
      activeAnalysisId: initialActiveId(),
      taskCompletions: {},
      simulate: "none",

      setActive: (id) => set({ activeAnalysisId: id }),

      upsertAnalysis: (entry) =>
        set((s) => {
          const exists = s.analyses.some((a) => a.id === entry.id);
          return {
            analyses: exists
              ? s.analyses.map((a) => (a.id === entry.id ? entry : a))
              : [entry, ...s.analyses],
          };
        }),

      updateStatus: (id, status) =>
        set((s) => ({
          analyses: s.analyses.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

      removeAnalysis: (id) =>
        set((s) => {
          const analyses = s.analyses.filter((a) => a.id !== id);
          return {
            analyses,
            activeAnalysisId: s.activeAnalysisId === id ? analyses[0]?.id ?? null : s.activeAnalysisId,
          };
        }),

      toggleTask: (analysisId, taskId) =>
        set((s) => {
          const forAnalysis = { ...(s.taskCompletions[analysisId] ?? {}) };
          forAnalysis[taskId] = !forAnalysis[taskId];
          return { taskCompletions: { ...s.taskCompletions, [analysisId]: forAnalysis } };
        }),

      setSimulate: (mode) => {
        set({ simulate: mode });
        try {
          if (mode === "none") localStorage.removeItem(STORAGE_KEYS.mockSimulate);
          else localStorage.setItem(STORAGE_KEYS.mockSimulate, mode);
        } catch {
          /* ignore */
        }
      },

      resetAll: () => {
        set({
          analyses: initialAnalyses(),
          activeAnalysisId: initialActiveId(),
          taskCompletions: {},
          simulate: "none",
        });
        try {
          localStorage.removeItem(STORAGE_KEYS.mockRuns);
          localStorage.removeItem(STORAGE_KEYS.mockSimulate);
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: STORAGE_KEYS.workspace,
      storage: createJSONStorage(() => localStorage),
      /**
       * Live mode must never show synthetic history: drop any persisted
       * demo-flagged analyses (e.g. from an earlier mock-mode session) when
       * the app runs against the real backend.
       */
      merge: (persisted, current) => {
        const p = persisted as Partial<WorkspaceState> | undefined;
        if (IS_DEMO || !p?.analyses) return { ...current, ...(p ?? {}) };
        const live = p.analyses.filter((a) => !a.demo);
        return {
          ...current,
          ...p,
          analyses: live,
          activeAnalysisId:
            p.activeAnalysisId && live.some((a) => a.id === p.activeAnalysisId)
              ? p.activeAnalysisId
              : (live[0]?.id ?? null),
        };
      },
    },
  ),
);
