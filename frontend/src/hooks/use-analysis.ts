"use client";

/**
 * Analysis data hooks — the bridge between the API service and the UI.
 * Handles loading/error states, result caching and status polling.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  cacheActivation,
  cachePartners,
  cachePortfolio,
  getActivation,
  getAnalysis,
  getCachedResults,
  getPartners,
  getPortfolio,
  isTerminal,
  pollAnalysis,
} from "@/lib/api/client";
import { useWorkspace } from "@/lib/store";
import type {
  ActivationResponse,
  Analysis,
  PartnersResponse,
  PortfolioResult,
} from "@/lib/api/types";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Fetch any resource with loading/error state + retry. */
export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  enabled = true,
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // Async IIFE: all state updates happen asynchronously, never synchronously
    // in the effect body.
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcherRef.current();
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, nonce, ...deps]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, refetch };
}

/** Current analysis meta (id + index entry), resolving the active id. */
export function useActiveAnalysisMeta() {
  const { analyses, activeAnalysisId } = useWorkspace();
  const entry = analyses.find((a) => a.id === activeAnalysisId) ?? null;
  return {
    analysisId: activeAnalysisId,
    entry,
    hasActive: !!activeAnalysisId,
  };
}

/** Fetch + cache the full analysis record for an id. */
export function useAnalysis(analysisId: string | null): AsyncState<Analysis> {
  return useResource<Analysis>(
    async () => {
      if (!analysisId) throw new Error("No analysis selected");
      return getAnalysis(analysisId);
    },
    [analysisId],
    !!analysisId,
  );
}

/** Fetch + cache partner results for an analysis. */
export function usePartners(analysisId: string | null): AsyncState<PartnersResponse> {
  return useResource<PartnersResponse>(
    async () => {
      if (!analysisId) throw new Error("No analysis selected");
      const cached = getCachedResults(analysisId)?.partners;
      if (cached) return cached;
      const r = await getPartners(analysisId);
      cachePartners(analysisId, r);
      return r;
    },
    [analysisId],
    !!analysisId,
  );
}

/** Fetch + cache portfolio results for an analysis. */
export function usePortfolio(analysisId: string | null): AsyncState<PortfolioResult> {
  return useResource<PortfolioResult>(
    async () => {
      if (!analysisId) throw new Error("No analysis selected");
      const cached = getCachedResults(analysisId)?.portfolio;
      if (cached) return cached;
      const r = await getPortfolio(analysisId);
      cachePortfolio(analysisId, r);
      return r;
    },
    [analysisId],
    !!analysisId,
  );
}

/** Fetch + cache activation plans for an analysis. */
export function useActivation(analysisId: string | null): AsyncState<ActivationResponse> {
  return useResource<ActivationResponse>(
    async () => {
      if (!analysisId) throw new Error("No analysis selected");
      const cached = getCachedResults(analysisId)?.activation;
      if (cached) return cached;
      const r = await getActivation(analysisId);
      cacheActivation(analysisId, r);
      return r;
    },
    [analysisId],
    !!analysisId,
  );
}

/**
 * Live investigation tracking: polls until terminal status, updates the store
 * index, and exposes the current analysis. Used by the investigation workspace.
 */
export function useInvestigation(analysisId: string | null) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateStatus = useWorkspace((s) => s.updateStatus);
  const pollRef = useRef<ReturnType<typeof pollAnalysis> | null>(null);

  useEffect(() => {
    if (!analysisId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const a = await getAnalysis(analysisId);
        if (cancelled) return;
        setAnalysis(a);
        updateStatus(analysisId, a.status);
        if (isTerminal(a.status)) return;

        pollRef.current = pollAnalysis(analysisId, (update) => {
          if (cancelled) return;
          setAnalysis(update);
          updateStatus(analysisId, update.status);
        });
        pollRef.current.promise
          .then((final) => {
            if (!cancelled) setAnalysis(final);
          })
          .catch((err) => {
            if (!cancelled) {
              setError(err instanceof ApiError ? err.message : "Polling failed");
            }
          });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load analysis");
      }
    };
    load();

    return () => {
      cancelled = true;
      pollRef.current?.cancel();
    };
     
  }, [analysisId]);

  const refetch = useCallback(() => {
    setError(null);
    const a = analysisId;
    if (!a) return;
    getAnalysis(a)
      .then((fresh) => {
        setAnalysis(fresh);
        updateStatus(a, fresh.status);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analysis"));
  }, [analysisId, updateStatus]);

  return { analysis, error, refetch };
}
