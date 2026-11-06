/** Runtime validation for the FastAPI wire contract. UI models are created in
 * `client.ts`; keeping these schemas wire-shaped makes backend drift visible. */
import { z } from "zod";
import { ApiError } from "./errors";

export const analysisStatusSchema = z.enum([
  "queued", "running", "completed", "partial", "failed", "cancelled",
]);

const noticeSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  stage: z.string().nullable().optional(),
}).passthrough();

export const submitAnalysisResponseSchema = z.object({
  analysis_id: z.string().min(1),
  status: analysisStatusSchema,
}).passthrough();

export const analysisResponseSchema = z.object({
  analysis_id: z.string().min(1),
  status: analysisStatusSchema,
  stage: z.string().min(1),
  progress: z.number().min(0).max(100),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
  warnings: z.array(noticeSchema).default([]),
  errors: z.array(noticeSchema).default([]),
  report: z.record(z.string(), z.unknown()).nullable().optional(),
}).passthrough();

const detailEnvelope = z.object({
  analysis_id: z.string().min(1),
  status: analysisStatusSchema,
}).passthrough();

export const partnersResponseSchema = detailEnvelope.extend({
  partners: z.array(z.record(z.string(), z.unknown())).default([]),
  decision_makers: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const portfolioResponseSchema = detailEnvelope.extend({
  portfolio: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const activationResponseSchema = detailEnvelope.extend({
  activation: z.array(z.record(z.string(), z.unknown())).default([]),
  proposals: z.array(z.record(z.string(), z.unknown())).default([]),
});

export function validateResponse<T>(endpoint: string, schema: z.ZodType, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.length ? ` at "${first.path.join(".")}"` : "";
    throw new ApiError(
      "contract_mismatch",
      `Backend response for ${endpoint} does not match the documented FastAPI contract${path}: ${first?.message ?? "unknown issue"}.`,
      422,
    );
  }
  return result.data as T;
}
