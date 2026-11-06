/**
 * ALLIOME centralized API service.
 *
 * Modes:
 *  - "live" (default): calls the FastAPI backend at NEXT_PUBLIC_API_BASE_URL
 *    (GET /health, POST /api/analyze, GET /api/analyze/{id}[/partners|/portfolio|/activation])
 *  - "mock": serves fictional demo data from the client-side mock engine.
 *    Reserved for local development and automated tests — always clearly
 *    labelled in the UI so synthetic data is never mistaken for real research.
 *
 * Components never fetch directly — they use this module (and the
 * `useAnalysis` hooks) so switching modes is a pure configuration change.
 */

import {
  createMockRun,
  getMockActivation,
  getMockAnalysis,
  getMockPartners,
  getMockPortfolio,
  hasMockRun,
} from "./mock-engine";
import { SEED_ANALYSIS_ID } from "./demo-partners";
import {
  activationResponseSchema,
  analysisSchema,
  partnersResponseSchema,
  portfolioResponseSchema,
  submitAnalysisResponseSchema,
  validateResponse,
} from "./validate";
import { ApiError } from "./errors";
import type {
  ActivationResponse,
  Analysis,
  AnalysisStatus,
  ApiMode,
  AnalysisBrief,
  PartnersResponse,
  PortfolioResult,
  SubmitAnalysisResponse,
} from "./types";

// ─── Configuration ─────────────────────────────────────────────────────────

const envBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
const envMode = (process.env.NEXT_PUBLIC_API_MODE ?? "").trim().toLowerCase();
const envTimeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? "");

/** Default FastAPI address used when NEXT_PUBLIC_API_BASE_URL is not set. */
export const DEFAULT_API_BASE_URL = "http://localhost:8000";

/**
 * Live is the default — ALLIOME is a working prototype against the real
 * backend. Mock mode is an explicit opt-in for local dev & automated tests
 * (NEXT_PUBLIC_API_MODE=mock).
 */
export const API_MODE: ApiMode = envMode === "mock" ? "mock" : "live";
export const API_BASE_URL: string =
  API_MODE === "live" ? (envBaseUrl || DEFAULT_API_BASE_URL) : envBaseUrl;
export const IS_DEMO = API_MODE === "mock";

export const POLL_INTERVAL_MS = 2000;
export const POLL_TIMEOUT_MS = 15 * 60 * 1000; // 15 min hard stop
/** Per-request timeout (ms). POST /api/analyze only enqueues, so 30s is safe. */
export const REQUEST_TIMEOUT_MS =
  Number.isFinite(envTimeout) && envTimeout >= 1000 ? envTimeout : 30_000;
/** Health checks should fail fast. */
export const HEALTH_TIMEOUT_MS = 8_000;

export { ApiError } from "./errors";

const TERMINAL: AnalysisStatus[] = ["completed", "partial", "failed", "cancelled"];
export const isTerminal = (s: AnalysisStatus) => TERMINAL.includes(s);

// ─── Fetch helper (live mode) ──────────────────────────────────────────────

async function request<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      // Analyses are owned by the backend; no cookies needed for the demo API.
      credentials: "omit",
      cache: "no-store",
      signal: init?.signal ?? controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        "timeout",
        `Backend at ${API_BASE_URL} did not respond within ${Math.round((init?.timeoutMs ?? REQUEST_TIMEOUT_MS) / 1000)}s (${path}).`,
      );
    }
    throw new ApiError(
      "network_error",
      `Could not reach the backend at ${API_BASE_URL}. Is the FastAPI server running?`,
    );
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    let message = `Backend returned ${res.status}`;
    let code = `http_${res.status}`;
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
      code = body.code ?? code;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(code, message, res.status);
  }
  return res.json() as Promise<T>;
}

// ─── Health ────────────────────────────────────────────────────────────────

export interface HealthStatus {
  ok: boolean;
  mode: ApiMode;
  baseUrl: string | null;
  detail?: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  if (API_MODE === "mock") {
    return { ok: true, mode: "mock", baseUrl: null, detail: "Mock mode — fictional data from the built-in demo engine (dev/testing only)." };
  }
  try {
    await request<unknown>("/health", { timeoutMs: HEALTH_TIMEOUT_MS });
    return { ok: true, mode: "live", baseUrl: API_BASE_URL };
  } catch (err) {
    return {
      ok: false,
      mode: "live",
      baseUrl: API_BASE_URL,
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Endpoints ─────────────────────────────────────────────────────────────

export async function submitBrief(brief: AnalysisBrief): Promise<SubmitAnalysisResponse> {
  if (API_MODE === "mock") {
    const id = `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    createMockRun(id, brief);
    return { analysis_id: id, status: "queued" };
  }
  const data = await request<unknown>("/api/analyze", {
    method: "POST",
    body: JSON.stringify(brief),
  });
  return validateResponse<SubmitAnalysisResponse>("POST /api/analyze", submitAnalysisResponseSchema, data);
}

export async function getAnalysis(id: string): Promise<Analysis> {
  if (API_MODE === "mock") {
    return getMockAnalysis(id);
  }
  const data = await request<unknown>(`/api/analyze/${id}`);
  const analysis = validateResponse<Analysis>(`GET /api/analyze/${id}`, analysisSchema, data);
  return { ...analysis, demo: false };
}

export async function getPartners(id: string): Promise<PartnersResponse> {
  if (API_MODE === "mock") {
    return getMockPartners(id);
  }
  const data = await request<unknown>(`/api/analyze/${id}/partners`);
  return validateResponse<PartnersResponse>(`GET /api/analyze/${id}/partners`, partnersResponseSchema, data);
}

export async function getPortfolio(id: string): Promise<PortfolioResult> {
  if (API_MODE === "mock") {
    return getMockPortfolio(id);
  }
  const data = await request<unknown>(`/api/analyze/${id}/portfolio`);
  return validateResponse<PortfolioResult>(`GET /api/analyze/${id}/portfolio`, portfolioResponseSchema, data);
}

export async function getActivation(id: string): Promise<ActivationResponse> {
  if (API_MODE === "mock") {
    return getMockActivation(id);
  }
  const data = await request<unknown>(`/api/analyze/${id}/activation`);
  return validateResponse<ActivationResponse>(`GET /api/analyze/${id}/activation`, activationResponseSchema, data);
}

/** True when an id belongs to the demo/mock world (for labelling purposes). */
export function isDemoAnalysis(id: string): boolean {
  return IS_DEMO && (id === SEED_ANALYSIS_ID || hasMockRun(id));
}

// ─── Polling helper ────────────────────────────────────────────────────────

export interface PollHandle {
  cancel: () => void;
  promise: Promise<Analysis>;
}

/**
 * Polls an analysis until it reaches a terminal status (or times out).
 * Resolves with the last terminal analysis; rejects with ApiError on timeout.
 */
export function pollAnalysis(
  id: string,
  onUpdate?: (a: Analysis) => void,
  intervalMs = POLL_INTERVAL_MS,
): PollHandle {
  let cancelled = false;
  const started = Date.now();
  let consecutiveErrors = 0;

  const promise = new Promise<Analysis>((resolve, reject) => {
    const tick = async () => {
      if (cancelled) return;
      if (Date.now() - started > POLL_TIMEOUT_MS) {
        reject(new ApiError("poll_timeout", "Timed out waiting for the investigation to finish."));
        return;
      }
      try {
        const analysis = await getAnalysis(id);
        consecutiveErrors = 0;
        onUpdate?.(analysis);
        if (isTerminal(analysis.status)) {
          resolve(analysis);
          return;
        }
      } catch (err) {
        // Transient network error: keep polling a few times before giving up.
        if (err instanceof ApiError && (err.code === "network_error" || err.code === "timeout" || err.code === "http_502" || err.code === "http_503")) {
          consecutiveErrors += 1;
          if (consecutiveErrors >= 4) {
            reject(err);
            return;
          }
        } else {
          reject(err);
          return;
        }
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });

  return {
    cancel: () => {
      cancelled = true;
    },
    promise,
  };
}

// ─── Result cache (per session) ────────────────────────────────────────────

const resultsCache = new Map<string, { partners?: PartnersResponse; portfolio?: PortfolioResult; activation?: ActivationResponse }>();

export function getCachedResults(id: string) {
  return resultsCache.get(id);
}

export function cachePartners(id: string, r: PartnersResponse) {
  const entry = resultsCache.get(id) ?? {};
  entry.partners = r;
  resultsCache.set(id, entry);
}

export function cachePortfolio(id: string, r: PortfolioResult) {
  const entry = resultsCache.get(id) ?? {};
  entry.portfolio = r;
  resultsCache.set(id, entry);
}

export function cacheActivation(id: string, r: ActivationResponse) {
  const entry = resultsCache.get(id) ?? {};
  entry.activation = r;
  resultsCache.set(id, entry);
}
