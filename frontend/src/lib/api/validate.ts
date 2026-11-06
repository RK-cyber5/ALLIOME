/**
 * Runtime response validation for the FastAPI backend contract.
 *
 * The backend is owned by Person 1 (Codex). These validators verify every
 * response against the documented contract (`src/lib/api/types.ts`) BEFORE it
 * reaches the UI, and raise a precise `contract_mismatch` error naming the
 * endpoint and the offending field — so schema drift surfaces immediately
 * with an actionable message instead of silently rendering garbage.
 *
 * Validators are intentionally lenient about optional/extra fields but strict
 * about the fields the UI depends on.
 */

import { z } from "zod";
import { ApiError } from "./errors";

// ─── Shared primitives ─────────────────────────────────────────────────────

const statusEnum = z.enum([
  "queued",
  "running",
  "completed",
  "partial",
  "failed",
  "cancelled",
]);

const stageStatusEnum = z.enum(["pending", "running", "completed", "failed", "skipped"]);

const confidenceEnum = z.enum(["high", "medium", "low"]);
const capabilityLevelEnum = z.enum(["strong", "moderate", "emerging"]);
const supportEnum = z.enum(["verified", "unverified", "contradicted"]);
const coverageEnum = z.enum(["supported", "partial", "not_established"]);
const phaseEnum = z.enum(["week_1", "week_2", "week_3", "week_4"]);
const ownerEnum = z.enum(["you", "partner", "joint"]);

const isoString = z.string().min(1);

// ─── Schemas ───────────────────────────────────────────────────────────────

export const submitAnalysisResponseSchema = z.object({
  analysis_id: z.string().min(1),
  status: statusEnum,
});

export const analysisSchema = z.object({
  analysis_id: z.string().min(1),
  status: statusEnum,
  brief: z.object({
    company: z.object({
      name: z.string(),
      website: z.string(),
      product_name: z.string(),
      product_description: z.string(),
    }),
    target_market: z.object({
      geography: z.string(),
      industry: z.string(),
      ideal_customer: z.string(),
      objective: z.string(),
    }),
    required_capabilities: z.array(
      z.object({
        key: z.string(),
        name: z.string(),
        importance: z.enum(["critical", "high", "medium", "low"]),
        rationale: z.string(),
      }),
    ),
    partner_types: z.array(z.string()),
    max_candidates: z.number(),
  }),
  created_at: isoString,
  updated_at: isoString,
  stages: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      status: stageStatusEnum,
      started_at: z.string().nullable().optional(),
      completed_at: z.string().nullable().optional(),
      detail: z.string().nullable().optional(),
    }),
  ),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      stage: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const partnersResponseSchema = z.object({
  analysis_id: z.string().min(1),
  partners: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      website: z.string(),
      hq: z.string(),
      category: z.string(),
      employees: z.string().nullable().optional(),
      strategic_fit: z.number(),
      activation_readiness: z.number(),
      evidence_confidence: confidenceEnum,
      capabilities: z.array(
        z.object({
          key: z.string(),
          name: z.string(),
          level: capabilityLevelEnum,
        }),
      ),
      geography: z.array(z.string()),
      technology_compatibility: z.object({
        score: z.number(),
        notes: z.string(),
      }),
      decision_makers: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          role: z.string(),
          relevance: z.string(),
          evidence_ids: z.array(z.string()),
          confidence: confidenceEnum,
          linkedin_url: z.string().nullable().optional(),
        }),
      ),
      unknowns: z.array(z.string()),
      profile: z.object({
        overview: z.string(),
        services: z.array(z.string()),
        industry_expertise: z.array(
          z.object({
            industry: z.string(),
            detail: z.string(),
            evidence_ids: z.array(z.string()),
          }),
        ),
        technology: z.object({
          stack: z.array(z.string()),
          integrations: z.array(z.string()),
          notes: z.string(),
          evidence_ids: z.array(z.string()),
        }),
        hiring_momentum: z.object({
          summary: z.string(),
          signals: z.array(
            z.object({
              signal: z.string(),
              evidence_ids: z.array(z.string()),
            }),
          ),
        }),
        partnership_rationale: z.string(),
      }),
      evidence: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          url: z.string(),
          publisher: z.string(),
          retrieved_at: isoString,
          support: supportEnum,
          note: z.string().optional(),
        }),
      ),
    }),
  ),
  partial: z
    .object({
      reason: z.string(),
      missing: z.array(z.string()),
    })
    .nullable()
    .optional(),
});

export const portfolioResponseSchema = z.object({
  analysis_id: z.string().min(1),
  selected: z.array(
    z.object({
      partner_id: z.string(),
      contributions: z.array(
        z.object({
          capability_key: z.string(),
          level: capabilityLevelEnum,
        }),
      ),
      rationale: z.string(),
    }),
  ),
  capabilities: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
      importance: z.enum(["critical", "high", "medium", "low"]),
      rationale: z.string(),
    }),
  ),
  coverage: z.array(
    z.object({
      capability_key: z.string(),
      partner_id: z.string(),
      status: coverageEnum,
      note: z.string().optional(),
    }),
  ),
  complementarity: z.object({
    narrative: z.string(),
    vs_top_scores: z.string(),
    redundancies: z.array(
      z.object({
        capability_key: z.string(),
        partner_ids: z.array(z.string()),
        note: z.string(),
      }),
    ),
    gaps: z.array(
      z.object({
        capability_key: z.string(),
        note: z.string(),
      }),
    ),
  }),
  alternatives: z.array(
    z.object({
      replace_partner_id: z.string(),
      alternative_partner_id: z.string(),
      effect: z.string(),
      coverage_delta: z.array(
        z.object({
          capability_key: z.string(),
          change: z.enum(["improved", "weakened", "unchanged"]),
          note: z.string(),
        }),
      ),
    }),
  ),
});

export const activationResponseSchema = z.object({
  analysis_id: z.string().min(1),
  activations: z.array(
    z.object({
      partner_id: z.string(),
      rationale: z.string(),
      partner_benefit: z.string(),
      proposed_role: z.string(),
      joint_value_proposition: z.string(),
      joint_solution: z.string(),
      target_customer_profile: z.string(),
      pilot_scope: z.string(),
      commercial_model: z.string(),
      success_metrics: z.array(z.string()),
      technical_dependencies: z.array(z.string()),
      decision_maker_ids: z.array(z.string()),
      draft_outreach: z.string(),
      meeting_agenda: z.array(z.string()),
      roadmap: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          phase: phaseEnum,
          owner: ownerEnum,
        }),
      ),
    }),
  ),
});

// ─── Validation entry point ────────────────────────────────────────────────

/**
 * Validate a backend response against its schema. On mismatch, throws an
 * ApiError("contract_mismatch") whose message names the endpoint and the
 * exact zod issue, so backend schema drift is diagnosable at a glance.
 * The ORIGINAL parsed JSON is returned untouched, typed as T (the frontend
 * contract type) — unknown extra fields pass through; only the documented
 * skeleton is enforced at runtime.
 */
export function validateResponse<T>(
  endpoint: string,
  schema: z.ZodType,
  data: unknown,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.length ? ` at "${first.path.join(".")}"` : "";
    throw new ApiError(
      "contract_mismatch",
      `Backend response for ${endpoint} does not match the agreed API contract${path}: ${first?.message ?? "unknown issue"}. ` +
        `See src/lib/api/types.ts and FRONTEND_AUDIT_REPORT.md — coordinate with the backend owner.`,
      422,
    );
  }
  return data as T;
}
