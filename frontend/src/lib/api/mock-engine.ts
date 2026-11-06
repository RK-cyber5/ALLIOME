/**
 * ALLIOME mock engine — client-side demo backend.
 *
 * Simulates the FastAPI analysis workflow behind the API adapter:
 *  - POST /api/analyze        → registers a run, returns an id
 *  - GET  /api/analyze/{id}   → time-based stage progression → terminal status
 *  - results endpoints        → deterministic fictional partners derived from the brief
 *
 * Everything it returns is FICTIONAL DEMO DATA and is flagged `demo: true` so the
 * UI can label it. Swap to the real backend by setting NEXT_PUBLIC_API_MODE=live
 * and NEXT_PUBLIC_API_BASE_URL — no component changes required.
 */

import {
  DEMO_PARTNERS,
  DEMO_PARTNER_BY_ID,
  SEED_ANALYSIS_ID,
} from "./demo-partners";
import {
  DEMO_ACTIVATIONS,
  DEMO_PORTFOLIO,
  DEMO_SEED_ANALYSIS,
} from "./demo-results";
import type {
  ActivationPlan,
  ActivationResponse,
  Analysis,
  AnalysisBrief,
  AnalysisStage,
  AnalysisStatus,
  Partner,
  PartnersResponse,
  PortfolioResult,
  RequiredCapability,
} from "./types";
import { STORAGE_KEYS, migrateStorageKeys } from "./storage-keys";

// Migrate any legacy `pp.*` keys before reading mock-runs.
migrateStorageKeys();

// ─── Stage schedule (seconds, cumulative) ──────────────────────────────────

const STAGE_SCHEDULE: { key: string; label: string; seconds: number; detail: string }[] = [
  { key: "analysing_company", label: "Analysing company & product", seconds: 4, detail: "" },
  { key: "compiling_capability_gaps", label: "Compiling capability gaps", seconds: 4, detail: "" },
  { key: "discovering_partners", label: "Discovering partner companies", seconds: 7, detail: "" },
  { key: "investigating_capabilities", label: "Investigating business capabilities", seconds: 9, detail: "" },
  { key: "identifying_decision_makers", label: "Identifying decision-makers", seconds: 6, detail: "" },
  { key: "collecting_evidence", label: "Collecting evidence", seconds: 7, detail: "" },
  { key: "evaluating_fit", label: "Evaluating individual partner fit", seconds: 5, detail: "" },
  { key: "optimising_portfolio", label: "Optimising the portfolio", seconds: 4, detail: "" },
  { key: "generating_activation", label: "Generating activation plans", seconds: 4, detail: "" },
];

export const TOTAL_STAGE_SECONDS = STAGE_SCHEDULE.reduce((s, x) => s + x.seconds, 0);

const TERMINAL: AnalysisStatus[] = ["completed", "partial", "failed", "cancelled"];

// ─── Run registry ──────────────────────────────────────────────────────────

interface MockRun {
  id: string;
  brief: AnalysisBrief;
  createdAt: number;
  /** Simulated wall-clock duration multiplier (1 = ~50s). */
  speed: number;
  simulate: "none" | "fail" | "partial";
}

const RUNS_KEY = STORAGE_KEYS.mockRuns;

function loadRuns(): Map<string, MockRun> {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    if (!raw) return new Map();
    const arr = JSON.parse(raw) as MockRun[];
    return new Map(arr.map((r) => [r.id, r]));
  } catch {
    return new Map();
  }
}

function saveRuns(runs: Map<string, MockRun>) {
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(Array.from(runs.values())));
  } catch {
    /* storage full / unavailable — in-memory only */
  }
}

export function createMockRun(id: string, brief: AnalysisBrief): string {
  const runs = loadRuns();
  let simulate: MockRun["simulate"] = "none";
  try {
    const flag = localStorage.getItem(STORAGE_KEYS.mockSimulate);
    if (flag === "fail" || flag === "partial") simulate = flag;
  } catch {
    /* no localStorage */
  }
  runs.set(id, { id, brief, createdAt: Date.now(), speed: 1, simulate });
  saveRuns(runs);
  return id;
}

function getRun(id: string): MockRun | undefined {
  return loadRuns().get(id);
}

export function hasMockRun(id: string) {
  return id === SEED_ANALYSIS_ID || loadRuns().has(id);
}

// ─── Deterministic helpers ─────────────────────────────────────────────────

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const jitter = (base: number, seed: string, spread = 4) =>
  Math.max(1, Math.min(99, base - spread + (hash(seed) % (spread * 2 + 1))));

const CAP_NAMES = new Map(
  DEMO_PARTNERS.flatMap((p) => p.capabilities.map((c) => [c.key, c.name] as const)),
);

/** Canonicalise capability keys so briefs and partner records compare cleanly. */
const KEY_ALIASES: Record<string, string> = {
  manufacturing_domain: "domain_expertise",
  domain_expertise: "domain_expertise",
  mes_erp_integration: "technical_integration",
  technical_integration: "technical_integration",
  eu_cloud_deployment: "cloud_deployment",
  cloud_deployment: "cloud_deployment",
  german_distribution: "distribution_channel",
  distribution_channel: "distribution_channel",
};
const canon = (k: string) => KEY_ALIASES[k] ?? k;

function capName(key: string) {
  return CAP_NAMES.get(key) ?? key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

// ─── Analysis state from wall clock ────────────────────────────────────────

export function getMockAnalysis(id: string): Analysis {
  if (id === SEED_ANALYSIS_ID) return DEMO_SEED_ANALYSIS;
  const run = getRun(id);
  if (!run) {
    return {
      analysis_id: id,
      status: "failed",
      brief: DEMO_SEED_ANALYSIS.brief,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      demo: true,
      stage: "failed",
      progress: 0,
      warnings: [],
      errors: [{ code: "not_found", message: `Analysis ${id} was not found in the demo engine.` }],
      stages: [],
      error: { code: "not_found", message: `Analysis ${id} was not found in the demo engine.` },
    };
  }

  const brief = run.brief;
  const elapsed = (Date.now() - run.createdAt) / 1000 * run.speed;
  const shortName = brief.company.name || "your company";

  const stages: AnalysisStage[] = [];
  let cumulative = 0;
  let terminalStatus: AnalysisStatus = "running";

  for (const s of STAGE_SCHEDULE) {
    const start = cumulative;
    cumulative += s.seconds;
    if (run.simulate === "fail" && s.key === "investigating_capabilities" && elapsed >= start + 2) {
      stages.push({
        key: s.key,
        label: s.label,
        status: "failed",
        started_at: new Date(run.createdAt + start * 1000).toISOString(),
        completed_at: null,
        detail: "Evidence collection aborted",
      });
      terminalStatus = "failed";
      break;
    }
    if (elapsed >= cumulative) {
      stages.push({
        key: s.key,
        label: s.label,
        status: "completed",
        started_at: new Date(run.createdAt + start * 1000).toISOString(),
        completed_at: new Date(run.createdAt + cumulative * 1000).toISOString(),
        detail: detailFor(s.key, brief, run),
      });
    } else if (elapsed >= start) {
      stages.push({
        key: s.key,
        label: s.label,
        status: "running",
        started_at: new Date(run.createdAt + start * 1000).toISOString(),
        completed_at: null,
        detail: null,
      });
      terminalStatus = "running";
      break;
    } else {
      stages.push({ key: s.key, label: s.label, status: "pending", started_at: null, completed_at: null, detail: null });
      terminalStatus = "queued";
      break;
    }
  }

  if (stages.every((s) => s.status === "completed")) {
    terminalStatus =
      run.simulate === "partial" ? "partial" : "completed";
  }

  // Append stages after the break point as pending so the tracker always shows all nine.
  const remaining = STAGE_SCHEDULE.filter((s) => !stages.some((x) => x.key === s.key));

  return {
    analysis_id: id,
    status: terminalStatus,
    brief,
    created_at: new Date(run.createdAt).toISOString(),
    updated_at: new Date().toISOString(),
    demo: true,
    stage: stages.find((stage) => stage.status === "running" || stage.status === "failed")?.key ?? (terminalStatus === "queued" ? "queued" : "generating_activation"),
    progress: Math.round((stages.filter((stage) => stage.status === "completed").length / STAGE_SCHEDULE.length) * 100),
    warnings: [],
    errors: terminalStatus === "failed" ? [{ code: "evidence_timeout", message: "Demo simulation: evidence collection timed out on a candidate source.", stage: "investigating_capabilities" }] : [],
    stages: [...stages, ...remaining.map((s) => ({ key: s.key, label: s.label, status: "pending" as const, started_at: null, completed_at: null, detail: null }))],
    error:
      terminalStatus === "failed"
        ? {
            code: "evidence_timeout",
            message: "Demo simulation: evidence collection timed out on a candidate source.",
            stage: "investigating_capabilities",
          }
        : null,
  };
}

function detailFor(key: string, brief: AnalysisBrief, run: MockRun): string {
  const capCount = brief.required_capabilities.length;
  const maxC = Math.min(brief.max_candidates, DEMO_PARTNERS.length);
  switch (key) {
    case "analysing_company":
      return `${brief.company.product_name || "Product"} for ${brief.company.name || "your company"} — positioning mapped`;
    case "compiling_capability_gaps":
      return `${capCount} required capabilities identified for ${brief.target_market.geography || "target market"}`;
    case "discovering_partners":
      return `${maxC + 11} companies surfaced · ${maxC} candidates shortlisted`;
    case "investigating_capabilities":
      return `${maxC} candidates investigated across services, clients and delivery`;
    case "identifying_decision_makers":
      return `${Math.max(4, maxC + 5)} relevant decision-makers identified with evidence`;
    case "collecting_evidence":
      return `${maxC * 3 + 6} sources collected · ${run.simulate === "partial" ? 9 : 5} claims remain unverified`;
    case "evaluating_fit":
      return "Strategic fit & activation readiness scored per candidate";
    case "optimising_portfolio":
      return "Portfolio optimised for complementary capability coverage";
    case "generating_activation":
      return "Activation plans with 30-day roadmaps drafted";
    default:
      return "";
  }
}

// ─── Result generation from a custom brief ─────────────────────────────────

function partnersForBrief(run: MockRun): Partner[] {
  const brief = run.brief;
  const wantedTypes = brief.partner_types.length ? new Set(brief.partner_types) : null;
  const capKeys = new Set(brief.required_capabilities.map((c) => canon(c.key)));

  let pool = DEMO_PARTNERS.filter((p) => (wantedTypes ? wantedTypes.has(p.category) : true));
  if (pool.length < 4) pool = DEMO_PARTNERS;

  const scored = pool
    .map((p) => {
      const overlap = p.capabilities.filter((c) => capKeys.has(canon(c.key))).length;
      const matchScore = capKeys.size ? overlap / capKeys.size : 0.5;
      return { p, matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore || b.p.strategic_fit - a.p.strategic_fit);

  const chosen = scored.slice(0, Math.min(brief.max_candidates, scored.length));

  return chosen.map(({ p, matchScore }, i) => {
    const seed = `${run.id}:${p.id}`;
    const fit = jitter(Math.round(p.strategic_fit * (0.72 + matchScore * 0.28)), seed);
    const readiness = jitter(p.activation_readiness, `${seed}:r`);
    const unknownsExtra =
      run.simulate === "partial" && i % 4 === 3
        ? ["Decision-maker identification incomplete — leadership page could not be retrieved (demo partial mode)."]
        : [];
    const dms =
      run.simulate === "partial" && i % 4 === 3
        ? p.decision_makers.slice(0, 1)
        : p.decision_makers;
    return {
      ...p,
      strategic_fit: fit,
      activation_readiness: readiness,
      unknowns: [...p.unknowns, ...unknownsExtra],
      decision_makers: dms,
    };
  });
}

function portfolioForBrief(run: MockRun, partners: Partner[]): PortfolioResult {
  const brief = run.brief;
  const caps: RequiredCapability[] = brief.required_capabilities;

  // Greedy coverage selection: pick partners maximising strong coverage per capability.
  const selected: string[] = [];
  const covered = new Map<string, "strong" | "moderate" | "emerging">();
  const byId = new Map(partners.map((p) => [p.id, p]));
  const target = Math.min(4, partners.length);

  for (let round = 0; round < target; round++) {
    let best: { id: string; gain: number } | null = null;
    for (const p of partners) {
      if (selected.includes(p.id)) continue;
      let gain = 0;
      for (const c of caps) {
        const pc = p.capabilities.find((x) => canon(x.key) === canon(c.key));
        if (!pc) continue;
        const cur = covered.get(c.key);
        const w = pc.level === "strong" ? 3 : pc.level === "moderate" ? 2 : 1;
        if (!cur) gain += w;
        else if (w > (cur === "strong" ? 3 : cur === "moderate" ? 2 : 1)) gain += 0.5;
      }
      gain += p.strategic_fit / 1000; // tie-break on fit
      if (!best || gain > best.gain) best = { id: p.id, gain };
    }
    if (!best || best.gain <= 0) break;
    selected.push(best.id);
    for (const c of caps) {
      const pc = byId.get(best.id)!.capabilities.find((x) => canon(x.key) === canon(c.key));
      if (pc && !covered.has(c.key)) covered.set(c.key, pc.level);
    }
  }

  const coverage = caps.flatMap((c) =>
    selected.map((pid) => {
      const pc = byId.get(pid)!.capabilities.find((x) => canon(x.key) === canon(c.key));
      return {
        capability_key: c.key,
        partner_id: pid,
        status: pc ? (pc.level === "strong" ? ("supported" as const) : ("partial" as const)) : ("not_established" as const),
      };
    }),
  );

  const uncovered = caps.filter((c) => !covered.has(c.key));
  const topTwo = [...partners].sort((a, b) => b.strategic_fit - a.strategic_fit).slice(0, 2);

  return {
    analysis_id: run.id,
    selected: selected.map((pid) => {
      const p = byId.get(pid)!;
      const rationale = p.profile?.partnership_rationale
        ? `${p.profile.partnership_rationale.split(".")[0]}.`
        : `${p.name} selected for complementary coverage.`;
      return {
        partner_id: pid,
        contributions: p.capabilities
          .filter((c) => caps.some((b) => canon(b.key) === canon(c.key)))
          .map((c) => ({ capability_key: c.key, level: c.level })),
        rationale,
      };
    }),
    capabilities: caps,
    coverage,
    complementarity: {
      narrative: `The optimizer selected ${selected.length} partners whose contributions interlock rather than overlap: each partner was chosen for the capabilities it contributes to the portfolio, not only for its individual score. ${uncovered.length === 0 ? "Every required capability is covered by at least one selected partner." : `${uncovered.length} required capabilities remain without a strong contributor in the candidate set.`}`,
      vs_top_scores: `Ranking purely by individual score would select ${topTwo.map((p) => p.name).join(" and ")} (${topTwo.map((p) => p.strategic_fit).join(", ")}) — but both play overlapping roles. The selected portfolio trades individual points for complementary capability coverage across ${caps.length} requirements.`,
      redundancies: (() => {
        const sharedCap = caps.find(
          (c) =>
            selected.filter((pid) => byId.get(pid)!.capabilities.some((x) => canon(x.key) === canon(c.key))).length > 1,
        );
        if (!sharedCap || selected.length < 2) return [];
        return [
          {
            capability_key: sharedCap.key,
            partner_ids: selected.filter((pid) =>
              byId.get(pid)!.capabilities.some((x) => canon(x.key) === canon(sharedCap.key)),
            ),
            note: "Shared capability across partners — evaluate whether the overlap is deliberate redundancy or duplication to trim.",
          },
        ];
      })(),
      gaps: uncovered.map((c) => ({
        capability_key: c.key,
        note: "No selected partner establishes this capability — widen the candidate set or cover it with in-house capability.",
      })),
    },
    alternatives: partners
      .filter((p) => !selected.includes(p.id))
      .slice(0, 3)
      .map((alt) => ({
        replace_partner_id: selected[selected.length - 1] ?? selected[0],
        alternative_partner_id: alt.id,
        effect: `Substituting ${alt.name} reshapes coverage: ${alt.capabilities.filter((c) => caps.some((b) => canon(b.key) === canon(c.key))).map((c) => capName(c.key)).join(", ") || "limited capability overlap"}.`,
        coverage_delta: alt.capabilities
          .filter((c) => caps.some((b) => canon(b.key) === canon(c.key)))
          .slice(0, 3)
          .map((c) => ({
            capability_key: c.key,
            change: "improved" as const,
            note: `${c.level === "strong" ? "Strong" : c.level === "moderate" ? "Moderate" : "Emerging"} contribution`,
          })),
      })),
  };
}

function activationsForBrief(run: MockRun, partners: Partner[], selectedIds: string[]): ActivationResponse {
  const brief = run.brief;
  const productName = brief.company.product_name || "the platform";
  const company = brief.company.name || "our company";
  const activations: ActivationPlan[] = selectedIds.map((pid) => {
    const p = partners.find((x) => x.id === pid)!;
    const dm = p.decision_makers[0];
    const first = dm ? dm.name.split(" ").slice(-1)[0] : "there";
    return {
      partner_id: pid,
      rationale: p.profile?.partnership_rationale
        ? `${p.profile.partnership_rationale.split(".")[0]}.`
        : `${p.name} complements the portfolio.`,
      partner_benefit: `Extends ${p.name}'s current portfolio with ${productName} — a differentiator their competitors do not yet offer, plus a new recurring revenue stream.`,
      proposed_role: p.category === "reseller" ? "Distribution & channel partner" : p.category === "cloud" ? "Cloud & platform-operations partner" : p.category === "system_integrator" || p.category === "implementation" ? "Implementation & delivery partner" : "Advisory & demand-creation partner",
      joint_value_proposition: `${p.name}'s ${p.capabilities[0]?.name.toLowerCase() ?? "market position"} combined with ${productName}'s capability — one joint offer for ${brief.target_market.industry || "the target industry"} customers in ${brief.target_market.geography || "the target market"}.`,
      joint_solution: `A joint offering where ${p.name} leads with their strengths (${p.capabilities.slice(0, 2).map((c) => c.name.toLowerCase()).join(", ")}) and ${productName} provides the platform — packaged as a pilot engagement for one shared account.`,
      target_customer_profile: brief.target_market.ideal_customer || "Mid-size enterprises in the target segment.",
      pilot_scope: `One engagement with a shared account: ${p.name} leads the relationship, ${company} provides the platform; 12 weeks from kickoff to measurable readout. Scope to be agreed with the customer before start.`,
      commercial_model: "Revenue-share hypothesis: services at day rates, platform licensing with referral margin. To be validated during the pilot.",
      success_metrics: [
        "Pilot success criteria agreed and met with the customer",
        "Two qualified joint opportunities in the pipeline within 90 days",
        "A joint reference story approved by the pilot customer",
      ],
      technical_dependencies: [
        "Read access to the customer's core systems (to be scoped)",
        "Deployment environment — EU cloud or on-prem (to be scoped)",
        "Security review and data-processing agreement",
      ],
      decision_maker_ids: p.decision_makers.map((x) => x.id),
      draft_outreach: `Subject: Partnership idea — ${productName} for ${p.name}\n\nDear ${first},\n\nWhile mapping ${brief.target_market.geography || "the market"} for ${company}'s ${productName}, ${p.name} stood out for ${p.capabilities[0]?.name.toLowerCase() ?? "your position"}.\n\nWe are building a small circle of launch partners and would value your perspective on where a joint offer would strengthen your current portfolio.\n\nWould a 30-minute call in the next two weeks suit you?\n\nBest regards,\n${company}`,
      meeting_agenda: [
        "Introductions and objectives (5 min)",
        `${productName}: short demo (10 min)`,
        `${p.name}: where your clients feel the most pain (10 min)`,
        "Joint pilot sketch: scope, customer profile, success criteria (15 min)",
        "Commercial model hypothesis and next steps (10 min)",
      ],
      roadmap: [
        {
          id: `${pid}-r1`,
          title: "Review technical fit together",
          description: "Joint working session: architecture walkthrough against 2–3 customer estates.",
          phase: "week_1",
          owner: "joint",
        },
        {
          id: `${pid}-r2`,
          title: "Prepare solution presentation",
          description: "Co-develop the joint-offer deck: value proposition, pilot journey, success story.",
          phase: "week_1",
          owner: "you",
        },
        {
          id: `${pid}-r3`,
          title: "Identify pilot scope",
          description: "Shortlist candidate customers and agree success criteria before kickoff.",
          phase: "week_2",
          owner: "joint",
        },
        {
          id: `${pid}-r4`,
          title: "Prepare meeting agenda",
          description: "Agenda, tailored demo environment and pilot one-pager for the customer.",
          phase: "week_2",
          owner: "you",
        },
        {
          id: `${pid}-r5`,
          title: "Complete partner evaluation",
          description: `${p.name} internal assessment: delivery model, terms, enablement needs.`,
          phase: "week_3",
          owner: "partner",
        },
        {
          id: `${pid}-r6`,
          title: "Pilot kickoff preparation",
          description: "Data-access checklist, security package, pilot agreement draft.",
          phase: "week_4",
          owner: "joint",
        },
      ],
    };
  });
  return { analysis_id: run.id, activations };
}

export function getMockPartners(id: string): PartnersResponse {
  if (id === SEED_ANALYSIS_ID) {
    const resp = { analysis_id: id, partners: Array.from(DEMO_PARTNER_BY_ID.values()) };
    return resp;
  }
  const run = getRun(id);
  if (!run) return { analysis_id: id, partners: [], partial: { reason: "Analysis not found in the demo engine.", missing: ["all"] } };
  const analysis = getMockAnalysis(id);
  const partial = analysis.status === "partial";
  return {
    analysis_id: id,
    partners: partnersForBrief(run),
    partial: partial
      ? {
          reason: "Demo simulation: the run completed with degraded evidence coverage — some partners have incomplete decision-maker intelligence.",
          missing: ["Decision-maker completeness for 3 candidates"],
        }
      : null,
  };
}

export function getMockPortfolio(id: string): PortfolioResult {
  if (id === SEED_ANALYSIS_ID) return DEMO_PORTFOLIO;
  const run = getRun(id);
  if (!run) return { ...DEMO_PORTFOLIO, analysis_id: id, selected: [], coverage: [], alternatives: [] };
  const partners = partnersForBrief(run);
  return portfolioForBrief(run, partners);
}

export function getMockActivation(id: string): ActivationResponse {
  if (id === SEED_ANALYSIS_ID) return DEMO_ACTIVATIONS;
  const run = getRun(id);
  if (!run) return { analysis_id: id, activations: [] };
  const partners = partnersForBrief(run);
  const portfolio = portfolioForBrief(run, partners);
  return activationsForBrief(run, partners, portfolio.selected.map((s) => s.partner_id));
}
