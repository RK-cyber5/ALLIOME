/**
 * ALLIOME — backend API contract (frontend view).
 *
 * The backend owns these endpoints (FastAPI):
 *   GET  /health
 *   POST /api/analyze
 *   GET  /api/analyze/{analysis_id}
 *   GET  /api/analyze/{analysis_id}/partners
 *   GET  /api/analyze/{analysis_id}/portfolio
 *   GET  /api/analyze/{analysis_id}/activation
 *
 * `backend/API.md` was not available when this frontend was built, so the shapes
 * below document the contract this frontend assumes. All network access is
 * isolated behind `src/lib/api/client.ts`; if the real schema differs, remap it
 * in the adapter functions in that file — components consume only these types.
 */

// ─── Analysis lifecycle ────────────────────────────────────────────────────

export type AnalysisStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled";

export type StageStatus = "pending" | "running" | "completed" | "failed" | "skipped";

/** The nine backend workflow stages, in execution order. */
export const STAGE_KEYS = [
  "analysing_company",
  "compiling_capability_gaps",
  "discovering_partners",
  "investigating_capabilities",
  "identifying_decision_makers",
  "collecting_evidence",
  "evaluating_fit",
  "optimising_portfolio",
  "generating_activation",
] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

export interface AnalysisStage {
  key: StageKey | string;
  label: string;
  status: StageStatus;
  started_at?: string | null;
  completed_at?: string | null;
  /** Short human note produced by the backend, e.g. "12 candidates found". */
  detail?: string | null;
}

export interface AnalysisError {
  code: string;
  message: string;
  stage?: string | null;
}

// ─── Brief (request payload) ───────────────────────────────────────────────

export type Importance = "critical" | "high" | "medium" | "low";

export interface RequiredCapability {
  key: string;
  name: string;
  importance: Importance;
  rationale: string;
}

export type PartnerType =
  | "system_integrator"
  | "technology"
  | "implementation"
  | "consultancy"
  | "reseller"
  | "referral"
  | "cloud";

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  system_integrator: "System integrator",
  technology: "Technology partner",
  implementation: "Implementation partner",
  consultancy: "Consultancy",
  reseller: "Reseller",
  referral: "Referral partner",
  cloud: "Cloud partner",
};

export interface AnalysisBrief {
  company: {
    name: string;
    website: string;
    product_name: string;
    product_description: string;
  };
  target_market: {
    geography: string;
    industry: string;
    ideal_customer: string;
    objective: string;
  };
  required_capabilities: RequiredCapability[];
  partner_types: PartnerType[];
  max_candidates: number;
}

// ─── Analysis resource ─────────────────────────────────────────────────────

export interface Analysis {
  analysis_id: string;
  status: AnalysisStatus;
  brief: AnalysisBrief;
  created_at: string;
  updated_at: string;
  stages: AnalysisStage[];
  error?: AnalysisError | null;
  /** True when served by the frontend demo/mock engine (fictional data). */
  demo?: boolean;
}

export interface SubmitAnalysisResponse {
  analysis_id: string;
  status: AnalysisStatus;
}

// ─── Partners ──────────────────────────────────────────────────────────────

export type ConfidenceLevel = "high" | "medium" | "low";
export type CapabilityLevel = "strong" | "moderate" | "emerging";
export type EvidenceSupport = "verified" | "unverified" | "contradicted";

export interface EvidenceSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  retrieved_at: string; // ISO date
  support: EvidenceSupport;
  note?: string;
}

export interface DecisionMaker {
  id: string;
  name: string;
  role: string;
  /** Why this person matters for the partnership. */
  relevance: string;
  evidence_ids: string[];
  confidence: ConfidenceLevel;
  linkedin_url?: string | null;
}

export interface IndustryExpertise {
  industry: string;
  detail: string;
  evidence_ids: string[];
}

export interface HiringSignal {
  signal: string;
  evidence_ids: string[];
}

export interface PartnerProfile {
  overview: string;
  services: string[];
  industry_expertise: IndustryExpertise[];
  technology: {
    stack: string[];
    integrations: string[];
    notes: string;
    evidence_ids: string[];
  };
  hiring_momentum: {
    summary: string;
    signals: HiringSignal[];
  };
  /** Strategic partnership rationale — why this company for this brief. */
  partnership_rationale: string;
}

export interface PartnerCapability {
  key: string;
  name: string;
  level: CapabilityLevel;
}

export interface Partner {
  id: string;
  name: string;
  website: string;
  hq: string;
  category: PartnerType;
  employees?: string | null;
  /** 0–100 strategic fit for the brief. */
  strategic_fit: number;
  /** 0–100 activation readiness. */
  activation_readiness: number;
  evidence_confidence: ConfidenceLevel;
  capabilities: PartnerCapability[];
  geography: string[];
  technology_compatibility: {
    score: number; // 0–100
    notes: string;
  };
  decision_makers: DecisionMaker[];
  /** Important unknowns — information the investigation could not establish. */
  unknowns: string[];
  profile: PartnerProfile;
  evidence: EvidenceSource[];
}

export interface PartnersResponse {
  analysis_id: string;
  partners: Partner[];
  /** Present on partial results: what is missing and why. */
  partial?: {
    reason: string;
    missing: string[];
  } | null;
}

// ─── Portfolio ─────────────────────────────────────────────────────────────

export type CoverageStatus = "supported" | "partial" | "not_established";

export interface CoverageCell {
  capability_key: string;
  partner_id: string;
  status: CoverageStatus;
  note?: string;
}

export interface PortfolioContribution {
  capability_key: string;
  level: CapabilityLevel;
}

export interface SelectedPartner {
  partner_id: string;
  contributions: PortfolioContribution[];
  /** Why this partner is in the portfolio. */
  rationale: string;
}

export interface PortfolioResult {
  analysis_id: string;
  selected: SelectedPartner[];
  /** Required capabilities echoed with coverage summary. */
  capabilities: RequiredCapability[];
  coverage: CoverageCell[];
  complementarity: {
    /** Why this combination beats picking the top individual scores. */
    narrative: string;
    vs_top_scores: string;
    redundancies: { capability_key: string; partner_ids: string[]; note: string }[];
    gaps: { capability_key: string; note: string }[];
  };
  alternatives: {
    replace_partner_id: string;
    alternative_partner_id: string;
    effect: string;
    coverage_delta: { capability_key: string; change: "improved" | "weakened" | "unchanged"; note: string }[];
  }[];
}

// ─── Activation ────────────────────────────────────────────────────────────

export type RoadmapPhase = "week_1" | "week_2" | "week_3" | "week_4";

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  phase: RoadmapPhase;
  owner: "you" | "partner" | "joint";
}

export interface ActivationPlan {
  partner_id: string;
  rationale: string;
  partner_benefit: string;
  proposed_role: string;
  joint_value_proposition: string;
  joint_solution: string;
  target_customer_profile: string;
  pilot_scope: string;
  commercial_model: string;
  success_metrics: string[];
  technical_dependencies: string[];
  decision_maker_ids: string[];
  draft_outreach: string;
  meeting_agenda: string[];
  roadmap: RoadmapTask[];
}

export interface ActivationResponse {
  analysis_id: string;
  activations: ActivationPlan[];
}

// ─── Partner signals (overview feed) ───────────────────────────────────────

export type SignalType = "hiring" | "content" | "partnership" | "leadership" | "event";

export interface PartnerSignal {
  id: string;
  partner_id: string;
  partner_name: string;
  type: SignalType;
  text: string;
  observed_at: string; // ISO
  evidence_id?: string;
  url?: string;
}

// ─── Client info ───────────────────────────────────────────────────────────

export type ApiMode = "mock" | "live";
