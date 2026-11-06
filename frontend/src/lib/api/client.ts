/** FastAPI wire-contract adapter. React components consume view models only. */
import { createMockRun, getMockActivation, getMockAnalysis, getMockPartners, getMockPortfolio, hasMockRun } from "./mock-engine";
import { SEED_ANALYSIS_ID } from "./demo-partners";
import { activationResponseSchema, analysisResponseSchema, partnersResponseSchema, portfolioResponseSchema, submitAnalysisResponseSchema, validateResponse } from "./validate";
import { ApiError } from "./errors";
import { PARTNER_TYPE_LABELS } from "./types";
import type { ActivationPlan, ActivationResponse, Analysis, AnalysisBrief, AnalysisError, AnalysisStatus, ApiMode, ConfidenceLevel, EvidenceSource, Partner, PartnerType, PartnersResponse, PortfolioResult, RequiredCapability, SubmitAnalysisResponse } from "./types";

const envBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
const envMode = (process.env.NEXT_PUBLIC_API_MODE ?? "").trim().toLowerCase();
const envTimeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? "");
export const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
export const API_MODE: ApiMode = envMode === "mock" ? "mock" : "live";
export const API_BASE_URL = API_MODE === "live" ? (envBaseUrl || DEFAULT_API_BASE_URL) : envBaseUrl;
export const IS_DEMO = API_MODE === "mock";
export const POLL_INTERVAL_MS = 2000;
export const POLL_TIMEOUT_MS = 15 * 60 * 1000;
export const REQUEST_TIMEOUT_MS = Number.isFinite(envTimeout) && envTimeout >= 1000 ? envTimeout : 30_000;
export const HEALTH_TIMEOUT_MS = 8_000;
export { ApiError } from "./errors";

const TERMINAL: AnalysisStatus[] = ["completed", "partial", "failed", "cancelled"];
export const isTerminal = (status: AnalysisStatus) => TERMINAL.includes(status);
type RecordValue = Record<string, unknown>;
type BackendAnalysis = { analysis_id: string; status: AnalysisStatus; stage: string; progress: number; created_at: string; updated_at: string; warnings: RecordValue[]; errors: RecordValue[]; report?: RecordValue | null };
const submittedBriefs = new Map<string, AnalysisBrief>();
const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const records = (value: unknown): RecordValue[] => Array.isArray(value) ? value.map(record) : [];
const text = (value: unknown, fallback = ""): string => typeof value === "string" ? value : fallback;
const numeric = (value: unknown, fallback = 0): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const textList = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0) : [];
const keyFor = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "capability";
const label = (value: string) => value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, credentials: "omit", cache: "no-store", signal: init?.signal ?? controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new ApiError("timeout", `Backend at ${API_BASE_URL} did not respond within ${Math.round((init?.timeoutMs ?? REQUEST_TIMEOUT_MS) / 1000)}s (${path}).`);
    throw new ApiError("network_error", `Could not reach the backend at ${API_BASE_URL}. Is the FastAPI server running?`);
  } finally { clearTimeout(timeout); }
  if (!response.ok) {
    let code = `http_${response.status}`; let message = `Backend returned ${response.status}`;
    try { const body = record(await response.json()); const error = record(body.error); code = text(error.code, text(body.code, code)); message = text(error.message, text(body.detail, text(body.message, message))); } catch { /* non-JSON response */ }
    throw new ApiError(code, message, response.status);
  }
  return response.json() as Promise<T>;
}

export interface HealthStatus { ok: boolean; mode: ApiMode; baseUrl: string | null; detail?: string; }
export async function checkHealth(): Promise<HealthStatus> {
  if (API_MODE === "mock") return { ok: true, mode: "mock", baseUrl: null, detail: "Mock mode — fictional demo data." };
  try {
    const health = record(await request<unknown>("/health", { timeoutMs: HEALTH_TIMEOUT_MS }));
    if (health.status !== "ok" || health.service !== "alliome") throw new ApiError("invalid_health", "Backend health endpoint returned an unexpected response.");
    return { ok: true, mode: "live", baseUrl: API_BASE_URL };
  } catch (error) { return { ok: false, mode: "live", baseUrl: API_BASE_URL, detail: error instanceof Error ? error.message : "Unknown error" }; }
}

function toRequest(brief: AnalysisBrief) {
  return { company_name: brief.company.name.trim(), website: brief.company.website.trim() || undefined, product_description: brief.company.product_description.trim(), target_market: brief.target_market.geography.trim(), target_industry: brief.target_market.industry.trim(), ideal_customer: brief.target_market.ideal_customer.trim() || "Not specified", business_goal: brief.target_market.objective.trim(), required_capabilities: brief.required_capabilities.map((capability) => capability.name.trim()).filter(Boolean), partner_types: brief.partner_types.map((type) => PARTNER_TYPE_LABELS[type]), max_candidates: Math.min(50, Math.max(1, Math.round(brief.max_candidates))), max_partners: 3 };
}
function fallbackBrief(): AnalysisBrief { return { company: { name: "", website: "", product_name: "", product_description: "" }, target_market: { geography: "", industry: "", ideal_customer: "", objective: "" }, required_capabilities: [], partner_types: [], max_candidates: 20 }; }
function briefFromReport(report: RecordValue | null | undefined, fallback?: AnalysisBrief): AnalysisBrief {
  const brief = record(report?.customer_objective_and_assumptions);
  if (!Object.keys(brief).length) return fallback ?? fallbackBrief();
  const partner_types = textList(brief.partner_types).map((item) => (Object.entries(PARTNER_TYPE_LABELS) as [PartnerType, string][]).find(([, value]) => value.toLowerCase() === item.toLowerCase())?.[0]).filter((value): value is PartnerType => Boolean(value));
  return { company: { name: text(brief.company_name), website: text(brief.website), product_name: text(brief.company_name), product_description: text(brief.product_description) }, target_market: { geography: text(brief.target_market), industry: text(brief.target_industry), ideal_customer: text(brief.ideal_customer), objective: text(brief.business_goal) }, required_capabilities: textList(brief.required_capabilities).map((name) => ({ key: keyFor(name), name, importance: "medium", rationale: "Importance was not supplied by the backend." })), partner_types, max_candidates: numeric(brief.max_candidates, 20) };
}
function notice(value: RecordValue): AnalysisError { return { code: text(value.code, "backend_notice"), message: text(value.message, "Backend returned an unspecified notice."), stage: text(value.stage) || null }; }
function stageStatus(status: AnalysisStatus): "pending" | "running" | "completed" | "failed" | "skipped" { if (status === "completed" || status === "partial") return "completed"; if (status === "failed") return "failed"; if (status === "cancelled") return "skipped"; return status === "queued" ? "pending" : "running"; }
function toAnalysis(raw: BackendAnalysis): Analysis {
  const warnings = raw.warnings.map(notice); const errors = raw.errors.map(notice);
  return { analysis_id: raw.analysis_id, status: raw.status, brief: briefFromReport(raw.report, submittedBriefs.get(raw.analysis_id)), created_at: raw.created_at, updated_at: raw.updated_at, stage: raw.stage, progress: raw.progress, warnings, errors, stages: [{ key: raw.stage, label: label(raw.stage), status: stageStatus(raw.status), started_at: raw.status === "queued" ? null : raw.updated_at, completed_at: isTerminal(raw.status) ? raw.updated_at : null, detail: `${raw.progress}% reported by FastAPI` }], error: errors[0] ?? null, demo: false };
}
async function getBackendAnalysis(id: string): Promise<BackendAnalysis> { return validateResponse<BackendAnalysis>(`GET /api/analyze/${id}`, analysisResponseSchema, await request<unknown>(`/api/analyze/${id}`)); }
function confidence(score: number): ConfidenceLevel { return score >= 72 ? "high" : score >= 44 ? "medium" : "low"; }
function scoreFor(report: RecordValue | null | undefined, id: string): RecordValue { return records(report?.score_breakdowns).find((item) => text(item.company_id) === id) ?? {}; }
function evidenceFor(report: RecordValue | null | undefined, id: string): EvidenceSource[] { return records(report?.evidence_ledger).filter((item) => text(item.company_id) === id).map((item, index) => ({ id: `${id}:evidence:${index}`, title: text(item.claim, "Provider record field"), url: text(item.source_url), publisher: text(item.source_provider, "Crustdata"), retrieved_at: text(item.retrieved_at, new Date(0).toISOString()), support: text(item.status) === "supported" ? "provider_supported" : text(item.status) === "contradicted" ? "contradicted" : "unverified", note: text(item.explanation) })); }
function mapPartner(company: RecordValue, people: RecordValue[], report: RecordValue | null | undefined): Partner {
  const id = text(company.id, text(company.provider_id, text(company.name, "unknown"))); const score = scoreFor(report, id); const evidence = evidenceFor(report, id); const coverage = record(score.coverage); const capabilities = Object.entries(coverage).filter(([, supported]) => supported === true).map(([name]) => ({ key: keyFor(name), name, level: "emerging" as const }));
  const peopleForPartner = people.filter((person) => text(person.company_id) === id).map((person, index) => { const roles = records(person.current_roles); return { id: text(person.provider_person_id, `${id}:person:${index}`), name: text(person.name, "Name unavailable"), role: text(roles[0]?.title, text(person.headline, "Role not supplied by provider")), relevance: "Current-role data supplied by Crustdata; partnership relevance requires validation.", evidence_ids: [], confidence: person.evidence_status === "supported" ? "medium" as const : "low" as const, linkedin_url: text(person.profile_url) || null }; });
  const evidenceIds = evidence.filter((item) => item.support === "provider_supported").map((item) => item.id);
  return { id, name: text(company.name, "Unnamed company"), website: text(company.source_url, text(company.domain)), hq: text(company.country, "Location not supplied"), category: "system_integrator", employees: company.headcount == null ? null : String(company.headcount), strategic_fit: numeric(score.strategic_fit), activation_readiness: numeric(score.activation_readiness), evidence_confidence: confidence(numeric(score.evidence_confidence)), capabilities: capabilities.length ? capabilities : [{ key: "no_established_match", name: "No capability match established", level: "emerging" }], geography: [text(company.country, "Not supplied")], technology_compatibility: { score: 0, notes: "The backend does not provide a technology compatibility score." }, decision_makers: peopleForPartner, unknowns: ["Capability matches are keyword inferences from provider records, not verified delivery claims.", ...(!text(company.description) ? ["No provider company description was supplied."] : []), ...(!peopleForPartner.length ? ["No relevant decision-maker record was returned."] : [])], profile: { overview: text(company.description, "No company description was supplied by the provider."), services: capabilities.map((item) => `${item.name} (inferred)`), industry_expertise: textList(company.industries).map((industry) => ({ industry, detail: "Industry appears in the provider company record; it is not independently verified.", evidence_ids: evidenceIds })), technology: { stack: [], integrations: [], notes: "No technology stack or integration evidence was returned by the backend.", evidence_ids: [] }, hiring_momentum: { summary: "No hiring signals were returned by the backend.", signals: [] }, partnership_rationale: text(score.explanation, "No scoring explanation was supplied.") }, evidence };
}
function capabilitiesFromReport(report: RecordValue | null | undefined): RequiredCapability[] { return records(report?.capability_map).map((capability) => ({ key: keyFor(text(capability.canonical_name, text(capability.name))), name: text(capability.name, "Required capability"), importance: numeric(capability.importance_weight, 0.75) >= 0.95 ? "critical" : numeric(capability.importance_weight, 0.75) >= 0.85 ? "high" : "medium", rationale: text(capability.description, "Required by the submitted market-entry objective.") })); }
function mapPortfolio(id: string, portfolio: RecordValue, report: RecordValue | null | undefined): PortfolioResult {
  const capabilities = capabilitiesFromReport(report); const selectedIds = textList(portfolio.selected_partner_ids); const rationale = records(portfolio.selection_rationale); const capabilityPartners = record(portfolio.capability_to_partner); const inferred = new Set(textList(portfolio.inferred_but_unverified_capabilities)); const uncovered = new Set(textList(portfolio.uncovered_capabilities)); const nameToKey = new Map(capabilities.map((capability) => [capability.name, capability.key]));
  const coverage = capabilities.flatMap((capability) => { const ids = textList(capabilityPartners[capability.name]); return selectedIds.map((partnerId) => ({ capability_key: capability.key, partner_id: partnerId, status: uncovered.has(capability.name) ? "not_established" as const : ids.includes(partnerId) ? (inferred.has(capability.name) ? "partial" as const : "supported" as const) : "not_established" as const, note: inferred.has(capability.name) ? "Keyword inference only; backend reports no verified capability coverage." : undefined })); });
  return { analysis_id: id, capabilities, coverage, selected: selectedIds.map((partnerId) => { const item = rationale.find((value) => text(value.company_id) === partnerId) ?? {}; const contributions = textList(item.new_capabilities).map((name) => ({ capability_key: nameToKey.get(name) ?? keyFor(name), level: "emerging" as const })); return { partner_id: partnerId, contributions, rationale: `Backend optimizer selection value: ${numeric(item.selection_value)}. ${contributions.length ? "Contributions are inferred keyword matches and require validation." : "No distinct capability contribution was established."}` }; }), complementarity: { narrative: `Backend optimizer selected ${selectedIds.length} partner${selectedIds.length === 1 ? "" : "s"}. Verified weighted capability coverage: ${numeric(portfolio.weighted_capability_coverage)}%; inferred weighted coverage: ${numeric(portfolio.inferred_weighted_capability_coverage)}%.`, vs_top_scores: "Selection is based on the backend's deterministic coverage and score heuristic, not a verified commercial recommendation.", redundancies: records(portfolio.redundancy_warnings).map((item) => ({ capability_key: keyFor(text(textList(item.overlap)[0])), partner_ids: [text(item.company_id)], note: "The backend flagged overlap in inferred capability coverage." })), gaps: textList(portfolio.uncovered_capabilities).map((name) => ({ capability_key: nameToKey.get(name) ?? keyFor(name), note: "No supported coverage was established by the backend." })) }, alternatives: textList(portfolio.alternative_partner_ids).map((alternative) => ({ replace_partner_id: selectedIds[0] ?? alternative, alternative_partner_id: alternative, effect: "Alternative candidate identified by the backend; no substitution coverage delta was supplied.", coverage_delta: [] })) };
}
function phase(period: string): "week_1" | "week_2" | "week_3" | "week_4" { if (period.includes("8-14")) return "week_2"; if (period.includes("15-21")) return "week_3"; if (period.includes("22-30")) return "week_4"; return "week_1"; }
function mapActivation(id: string, activities: RecordValue[], proposals: RecordValue[], report: RecordValue | null | undefined): ActivationResponse {
  const blueprint = records(report?.joint_solution_blueprint); const partnerIds = [...new Set([...activities.map((item) => text(item.partner_id)), ...proposals.map((item) => text(item.partner_id))].filter(Boolean))];
  return { analysis_id: id, activations: partnerIds.map((partnerId) => { const proposal = proposals.find((item) => text(item.partner_id) === partnerId) ?? {}; const solution = blueprint.find((item) => text(item.partner_id) === partnerId) ?? {}; const tasks = activities.filter((item) => text(item.partner_id) === partnerId); return { partner_id: partnerId, rationale: "Backend-proposed activation plan. It is a hypothesis, not a partnership commitment.", partner_benefit: "Not established by backend evidence; validate with the partner.", proposed_role: text(solution.role, "Proposed complementary partner"), joint_value_proposition: text(solution.joint_value_proposition, "Not supplied by backend."), joint_solution: text(solution.pilot_scope, "Define with the partner after validation."), target_customer_profile: "Not established by the backend.", pilot_scope: text(solution.pilot_scope, "Define after partner validation."), commercial_model: "Not established by the backend.", success_metrics: tasks.map((task) => text(task.success_measure)).filter(Boolean), technical_dependencies: [...new Set(tasks.flatMap((task) => textList(task.dependencies)))], decision_maker_ids: [], draft_outreach: text(proposal.outreach_draft, "No outreach draft was supplied."), meeting_agenda: textList(proposal.meeting_agenda), roadmap: tasks.map((task, index) => ({ id: `${partnerId}:${index}`, title: text(task.activity, "Planned activity"), description: [text(task.expected_deliverable), textList(task.dependencies).length ? `Dependencies: ${textList(task.dependencies).join(", ")}.` : "", textList(task.risks).length ? `Risks: ${textList(task.risks).join(", ")}.` : ""].filter(Boolean).join(" "), phase: phase(text(task.period)), owner: text(task.responsible_role).toLowerCase().includes("partner") ? "partner" as const : "you" as const })) }; }) };
}

export async function submitBrief(brief: AnalysisBrief): Promise<SubmitAnalysisResponse> { if (API_MODE === "mock") { const id = `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; createMockRun(id, brief); return { analysis_id: id, status: "queued" }; } const response = validateResponse<SubmitAnalysisResponse>("POST /api/analyze", submitAnalysisResponseSchema, await request<unknown>("/api/analyze", { method: "POST", body: JSON.stringify(toRequest(brief)) })); submittedBriefs.set(response.analysis_id, brief); return response; }
export async function getAnalysis(id: string): Promise<Analysis> { return API_MODE === "mock" ? getMockAnalysis(id) : toAnalysis(await getBackendAnalysis(id)); }
export async function getPartners(id: string): Promise<PartnersResponse> { if (API_MODE === "mock") return getMockPartners(id); const data = validateResponse<RecordValue>(`GET /api/analyze/${id}/partners`, partnersResponseSchema, await request<unknown>(`/api/analyze/${id}/partners`)); const backend = await getBackendAnalysis(id); return { analysis_id: id, partners: records(data.partners).map((company) => mapPartner(company, records(data.decision_makers), backend.report)), partial: backend.status === "partial" ? { reason: "The backend returned partial results.", missing: backend.warnings.map((warning) => text(warning.message)).filter(Boolean) } : null }; }
export async function getPortfolio(id: string): Promise<PortfolioResult> { if (API_MODE === "mock") return getMockPortfolio(id); const data = validateResponse<RecordValue>(`GET /api/analyze/${id}/portfolio`, portfolioResponseSchema, await request<unknown>(`/api/analyze/${id}/portfolio`)); return mapPortfolio(id, record(data.portfolio), (await getBackendAnalysis(id)).report); }
export async function getActivation(id: string): Promise<ActivationResponse> { if (API_MODE === "mock") return getMockActivation(id); const data = validateResponse<RecordValue>(`GET /api/analyze/${id}/activation`, activationResponseSchema, await request<unknown>(`/api/analyze/${id}/activation`)); return mapActivation(id, records(data.activation), records(data.proposals), (await getBackendAnalysis(id)).report); }
export function isDemoAnalysis(id: string): boolean { return IS_DEMO && (id === SEED_ANALYSIS_ID || hasMockRun(id)); }

export interface PollHandle { cancel: () => void; promise: Promise<Analysis>; }
export function pollAnalysis(id: string, onUpdate?: (analysis: Analysis) => void, intervalMs = POLL_INTERVAL_MS): PollHandle { let cancelled = false; const started = Date.now(); let consecutiveErrors = 0; const promise = new Promise<Analysis>((resolve, reject) => { const tick = async () => { if (cancelled) return; if (Date.now() - started > POLL_TIMEOUT_MS) return reject(new ApiError("poll_timeout", "Timed out waiting for the investigation to finish.")); try { const analysis = await getAnalysis(id); consecutiveErrors = 0; onUpdate?.(analysis); if (isTerminal(analysis.status)) return resolve(analysis); } catch (error) { if (!(error instanceof ApiError && ["network_error", "timeout", "http_502", "http_503"].includes(error.code) && ++consecutiveErrors < 4)) return reject(error); } setTimeout(tick, intervalMs); }; void tick(); }); return { cancel: () => { cancelled = true; }, promise }; }
const resultsCache = new Map<string, { partners?: PartnersResponse; portfolio?: PortfolioResult; activation?: ActivationResponse }>();
export function getCachedResults(id: string) { return resultsCache.get(id); }
export function cachePartners(id: string, value: PartnersResponse) { resultsCache.set(id, { ...(resultsCache.get(id) ?? {}), partners: value }); }
export function cachePortfolio(id: string, value: PortfolioResult) { resultsCache.set(id, { ...(resultsCache.get(id) ?? {}), portfolio: value }); }
export function cacheActivation(id: string, value: ActivationResponse) { resultsCache.set(id, { ...(resultsCache.get(id) ?? {}), activation: value }); }
