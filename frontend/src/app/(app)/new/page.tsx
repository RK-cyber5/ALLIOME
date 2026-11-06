"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Globe2,
  ListChecks,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/app/page-header";
import { SectionLabel } from "@/components/shared/primitives";
import { ImportanceBadge } from "@/components/shared/scores";
import { submitBrief, IS_DEMO } from "@/lib/api/client";
import { entryFromBrief, useWorkspace } from "@/lib/store";
import type { AnalysisBrief, Importance, PartnerType, RequiredCapability } from "@/lib/api/types";
import { PARTNER_TYPE_LABELS } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Company", icon: Building2 },
  { id: 2, label: "Target market", icon: Target },
  { id: 3, label: "Capabilities", icon: ListChecks },
  { id: 4, label: "Partner types", icon: Users },
  { id: 5, label: "Scope & review", icon: Rocket },
];

const GEOGRAPHY_PRESETS = ["Germany & DACH", "United Kingdom & Ireland", "Nordics", "France", "Benelux", "North America", "Iberia", "Italy"];
const INDUSTRY_PRESETS = ["Discrete manufacturing", "Process industry", "Financial services", "Healthcare & life sciences", "Retail & e-commerce", "Logistics & supply chain", "Energy & utilities", "Construction"];

function suggestedCapabilities(industry: string): RequiredCapability[] {
  const domain = industry ? `Domain expertise in ${industry.toLowerCase()}` : "Industry domain expertise";
  return [
    {
      key: "domain_expertise",
      name: domain,
      importance: "critical",
      rationale: "Credibility with buyers in the target industry depends on partners who know the domain first-hand.",
    },
    {
      key: "enterprise_implementation",
      name: "Enterprise implementation & delivery",
      importance: "high",
      rationale: "On-site deployment, change management and training decide whether pilots convert to production rollouts.",
    },
    {
      key: "technical_integration",
      name: "Technical integration with customer systems",
      importance: "high",
      rationale: "The product must connect to the systems already running in target customers.",
    },
    {
      key: "cloud_deployment",
      name: "Cloud deployment & data residency",
      importance: "medium",
      rationale: "Local hosting and compliance options are increasingly a purchase prerequisite.",
    },
    {
      key: "distribution_channel",
      name: "Local distribution & channel reach",
      importance: "medium",
      rationale: "Transactional reach accelerates revenue beyond what direct sales can cover.",
    },
    {
      key: "industry_relationships",
      name: "Industry relationships & references",
      importance: "medium",
      rationale: "Warm introductions and credible references shorten enterprise sales cycles.",
    },
  ];
}

const ALL_PARTNER_TYPES = Object.keys(PARTNER_TYPE_LABELS) as PartnerType[];

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-medium text-foreground">
        {label} {required && <span className="text-brand-soft">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-faint">{hint}</p>}
    </div>
  );
}

const inputCls = "h-10 border-border bg-surface-1/70 text-[14px] text-foreground placeholder:text-faint focus-visible:ring-brand/50";
const textareaCls = "min-h-[88px] border-border bg-surface-1/70 text-[14px] leading-relaxed text-foreground placeholder:text-faint focus-visible:ring-brand/50";

export default function NewEcosystemPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const upsertAnalysis = useWorkspace((s) => s.upsertAnalysis);
  const setActive = useWorkspace((s) => s.setActive);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [company, setCompany] = useState({ name: "", website: "", product_name: "", product_description: "" });
  const [market, setMarket] = useState({ geography: "", industry: "", ideal_customer: "", objective: "" });
  const [capabilities, setCapabilities] = useState<RequiredCapability[]>([]);
  const [newCapName, setNewCapName] = useState("");
  const [partnerTypes, setPartnerTypes] = useState<PartnerType[]>(["system_integrator", "consultancy", "implementation"]);
  const [maxCandidates, setMaxCandidates] = useState(12);

  // Auto-suggest capabilities when the user first reaches step 3.
  const suggestIfEmpty = () => {
    if (capabilities.length === 0) {
      setCapabilities(suggestedCapabilities(market.industry));
    }
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!company.name.trim()) return "Company name is required.";
      if (!company.product_name.trim()) return "Product name is required.";
      if (!company.product_description.trim()) return "Product description is required.";
      if (company.website && !/^https?:\/\/.+\..+/.test(company.website.trim())) return "Website must be a full URL (https://…).";
    }
    if (s === 2) {
      if (!market.geography.trim()) return "Target geography is required.";
      if (!market.industry.trim()) return "Target industry is required.";
      if (!market.objective.trim()) return "Market-entry objective is required.";
    }
    if (s === 3 && capabilities.filter((c) => c.name.trim()).length === 0) {
      return "Add at least one required capability.";
    }
    if (s === 4 && partnerTypes.length === 0) return "Select at least one partner type.";
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    if (step === 2) suggestIfEmpty();
    setStep((v) => Math.min(5, v + 1));
  };
  const back = () => setStep((v) => Math.max(1, v - 1));

  const updateCap = (key: string, patch: Partial<RequiredCapability>) => {
    setCapabilities((caps) => caps.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const addCapability = () => {
    const name = newCapName.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40) || "custom";
    if (capabilities.some((c) => c.key === key)) {
      toast.error("A capability with a similar name already exists.");
      return;
    }
    setCapabilities((caps) => [...caps, { key, name, importance: "medium", rationale: "" }]);
    setNewCapName("");
  };

  const removeCapability = (key: string) => setCapabilities((caps) => caps.filter((c) => c.key !== key));

  const toggleType = (t: PartnerType) =>
    setPartnerTypes((types) => (types.includes(t) ? types.filter((x) => x !== t) : [...types, t]));

  const submit = async () => {
    for (const s of [1, 2, 3, 4]) {
      const err = validateStep(s);
      if (err) {
        toast.error(err);
        setStep(s);
        return;
      }
    }
    const brief: AnalysisBrief = {
      company: {
        name: company.name.trim(),
        website: company.website.trim(),
        product_name: company.product_name.trim(),
        product_description: company.product_description.trim(),
      },
      target_market: {
        geography: market.geography.trim(),
        industry: market.industry.trim(),
        ideal_customer: market.ideal_customer.trim(),
        objective: market.objective.trim(),
      },
      required_capabilities: capabilities.filter((c) => c.name.trim()),
      partner_types: partnerTypes,
      max_candidates: maxCandidates,
    };

    setSubmitting(true);
    try {
      const res = await submitBrief(brief);
      upsertAnalysis(entryFromBrief(res.analysis_id, brief, "queued", IS_DEMO));
      setActive(res.analysis_id);
      toast.success("Investigation submitted", {
        description: IS_DEMO
          ? "Running against the demo engine — all results will be labelled demo data."
          : "The backend has accepted your brief.",
      });
      router.push(`/investigations/${res.analysis_id}`);
    } catch (err) {
      toast.error("Submission failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const brief: AnalysisBrief = {
    company,
    target_market: market,
    required_capabilities: capabilities,
    partner_types: partnerTypes,
    max_candidates: maxCandidates,
  };

  return (
    <>
      <PageHeader
        title="New ecosystem"
        description="Describe your company, target market and required capabilities — ALLIOME investigates the market and engineers your partner portfolio."
      />

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto pb-1">
        <ol className="flex min-w-[560px] items-center gap-1.5">
          {STEPS.map((s, i) => {
            const state = step === s.id ? "current" : step > s.id ? "done" : "upcoming";
            return (
              <li key={s.id} className="flex flex-1 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => step > s.id && setStep(s.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-all",
                    state === "current" && "border-brand/40 bg-brand/10 text-foreground",
                    state === "done" && "border-mint/30 bg-mint/5 text-mint hover:bg-mint/10",
                    state === "upcoming" && "border-border bg-surface-1/60 text-faint",
                  )}
                >
                  {state === "done" ? <Check className="size-3.5" /> : <s.icon className="size-3.5" />}
                  <span className="whitespace-nowrap">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className={cn("h-px flex-1", step > s.id ? "bg-mint/40" : "bg-border")} />}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="card-sheen rounded-xl border bg-surface-2/50 p-5 sm:p-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: reduce ? 0 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : -24 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }}
          >
            {/* STEP 1 — Company */}
            {step === 1 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2 flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-lg border border-brand/25 bg-brand/10 text-brand-soft"><Building2 className="size-4" /></span>
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">Your company & product</h2>
                    <p className="text-xs text-muted-foreground">What are you bringing to the market?</p>
                  </div>
                </div>
                <Field label="Company name" required>
                  <Input className={inputCls} placeholder="e.g. Aivera" value={company.name} onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))} />
                </Field>
                <Field label="Website" hint="Used by the investigation to understand your positioning.">
                  <Input className={inputCls} placeholder="https://…" value={company.website} onChange={(e) => setCompany((c) => ({ ...c, website: e.target.value }))} />
                </Field>
                <Field label="Product name" required>
                  <Input className={inputCls} placeholder="e.g. Aivera Flow" value={company.product_name} onChange={(e) => setCompany((c) => ({ ...c, product_name: e.target.value }))} />
                </Field>
                <div className="hidden sm:block" />
                <Field label="Product description" required hint="What it does, how it is deployed, who it is for.">
                  <Textarea className={textareaCls} placeholder="An AI process-optimisation platform for…" value={company.product_description} onChange={(e) => setCompany((c) => ({ ...c, product_description: e.target.value }))} />
                </Field>
              </div>
            )}

            {/* STEP 2 — Target market */}
            {step === 2 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2 flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-lg border border-signal/25 bg-signal/10 text-signal"><Target className="size-4" /></span>
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">Target market</h2>
                    <p className="text-xs text-muted-foreground">Where are you going, and what does success look like?</p>
                  </div>
                </div>
                <Field label="Target geography" required>
                  <Input className={inputCls} placeholder="e.g. Germany & DACH" value={market.geography} onChange={(e) => setMarket((m) => ({ ...m, geography: e.target.value }))} list="geo-presets" />
                  <datalist id="geo-presets">
                    {GEOGRAPHY_PRESETS.map((g) => <option key={g} value={g} />)}
                  </datalist>
                </Field>
                <Field label="Target industry" required>
                  <Input className={inputCls} placeholder="e.g. Discrete manufacturing" value={market.industry} onChange={(e) => setMarket((m) => ({ ...m, industry: e.target.value }))} list="industry-presets" />
                  <datalist id="industry-presets">
                    {INDUSTRY_PRESETS.map((g) => <option key={g} value={g} />)}
                  </datalist>
                </Field>
                <Field label="Ideal customer" hint="Size, systems, maturity — whatever defines the buyers you want to reach.">
                  <Textarea className={cn(textareaCls, "min-h-[72px]")} placeholder="Mid-size manufacturers with an existing MES/ERP estate…" value={market.ideal_customer} onChange={(e) => setMarket((m) => ({ ...m, ideal_customer: e.target.value }))} />
                </Field>
                <Field label="Market-entry objective" required hint="The strategy your ecosystem should serve.">
                  <Textarea className={cn(textareaCls, "min-h-[72px]")} placeholder="Enter the market through indirect channels within two quarters…" value={market.objective} onChange={(e) => setMarket((m) => ({ ...m, objective: e.target.value }))} />
                </Field>
              </div>
            )}

            {/* STEP 3 — Required capabilities */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-lg border border-mint/25 bg-mint/10 text-mint"><ListChecks className="size-4" /></span>
                    <div>
                      <h2 className="text-[15px] font-semibold text-foreground">Required capabilities</h2>
                      <p className="text-xs text-muted-foreground">What must your partners be able to do?</p>
                    </div>
                  </div>
                  <span className="hidden items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-[11px] text-brand-soft sm:flex">
                    <Sparkles className="size-3" /> Auto-suggested
                  </span>
                </div>

                <div className="space-y-2.5">
                  {capabilities.length === 0 && (
                    <button
                      type="button"
                      onClick={suggestIfEmpty}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand/30 bg-brand/5 px-4 py-4 text-sm font-medium text-brand-soft transition-colors hover:bg-brand/10"
                    >
                      <Sparkles className="size-4" /> Load suggested capabilities
                    </button>
                  )}
                  {capabilities.map((c) => (
                    <div key={c.key} className="rounded-lg border border-border/80 bg-surface-1/60 p-3.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{c.name}</span>
                        <ImportanceBadge importance={c.importance} />
                        <Select value={c.importance} onValueChange={(v) => updateCap(c.key, { importance: v as Importance })}>
                          <SelectTrigger className="h-8 w-[110px] border-border bg-surface-2 text-xs" aria-label={`Importance of ${c.name}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-popover">
                            {["critical", "high", "medium", "low"].map((i) => (
                              <SelectItem key={i} value={i} className="text-xs capitalize">{i}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="size-8 text-faint hover:text-danger" onClick={() => removeCapability(c.key)} aria-label={`Remove ${c.name}`}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                      <Input
                        className="mt-2.5 h-8 border-border bg-surface-2/60 text-xs text-muted-foreground"
                        placeholder="Why this capability matters (rationale)"
                        value={c.rationale}
                        onChange={(e) => updateCap(c.key, { rationale: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2.5">
                  <Input
                    className={inputCls}
                    placeholder="Add a custom capability…"
                    value={newCapName}
                    onChange={(e) => setNewCapName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCapability())}
                  />
                  <Button variant="outline" onClick={addCapability} className="shrink-0">
                    <Plus className="size-4" /> Add
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4 — Partner types */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-lg border border-brand-soft/25 bg-brand/soft/10 text-brand-soft"><Users className="size-4" /></span>
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">Partner types</h2>
                    <p className="text-xs text-muted-foreground">Which kinds of partners should the investigation look for?</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {ALL_PARTNER_TYPES.map((t) => {
                    const active = partnerTypes.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleType(t)}
                        aria-pressed={active}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border px-3.5 py-3 text-left text-[13.5px] font-medium transition-all",
                          active
                            ? "border-brand/45 bg-brand/12 text-foreground shadow-[inset_0_0_0_1px_rgba(30,70,54,0.2)]"
                            : "border-border bg-surface-1/60 text-muted-foreground hover:border-brand/25 hover:text-foreground",
                        )}
                      >
                        {PARTNER_TYPE_LABELS[t]}
                        <span className={cn("grid size-4.5 place-items-center rounded border", active ? "border-brand bg-brand text-white" : "border-faint/40")}>
                          {active && <Check className="size-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5 — Scope & review */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-lg border border-signal/25 bg-signal/10 text-signal"><Rocket className="size-4" /></span>
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">Research scope & review</h2>
                    <p className="text-xs text-muted-foreground">Confirm the brief before the investigation starts.</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border/80 bg-surface-1/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[13px] font-medium">Maximum candidates to investigate</Label>
                      <p className="mt-1 text-xs text-faint">More candidates mean broader coverage and a longer investigation.</p>
                    </div>
                    <span className="font-mono text-2xl font-bold text-brand-soft">{maxCandidates}</span>
                  </div>
                  <Slider
                    className="mt-4"
                    min={6}
                    max={24}
                    step={1}
                    value={[maxCandidates]}
                    onValueChange={(v) => setMaxCandidates(v[0])}
                    aria-label="Maximum candidates"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-faint">
                    <span>6</span><span>24</span>
                  </div>
                </div>

                {/* Review */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/80 bg-surface-1/60 p-4">
                    <SectionLabel>Company & product</SectionLabel>
                    <p className="mt-2 text-sm font-medium text-foreground">{brief.company.name || "—"} · {brief.company.product_name || "—"}</p>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{brief.company.product_description || "No description."}</p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-surface-1/60 p-4">
                    <SectionLabel>Target market</SectionLabel>
                    <p className="mt-2 text-sm font-medium text-foreground">{brief.target_market.geography || "—"} · {brief.target_market.industry || "—"}</p>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{brief.target_market.objective || "No objective set."}</p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-surface-1/60 p-4">
                    <SectionLabel>Required capabilities ({capabilities.length})</SectionLabel>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {capabilities.map((c) => (
                        <span key={c.key} className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[11px] text-muted-foreground">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-surface-1/60 p-4">
                    <SectionLabel>Partner types ({partnerTypes.length}) · scope {maxCandidates}</SectionLabel>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {partnerTypes.map((t) => (
                        <span key={t} className="rounded-md border border-brand/25 bg-brand/10 px-2 py-0.5 text-[11px] text-brand-soft">
                          {PARTNER_TYPE_LABELS[t]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {IS_DEMO && (
                  <p className="rounded-lg border border-warn/25 bg-warn/5 px-4 py-3 text-xs leading-relaxed text-warn">
                    Demo mode: the investigation runs against the built-in mock engine and returns clearly-labelled fictional
                    demo records. Switch to the live FastAPI backend in Settings or via NEXT_PUBLIC_API_BASE_URL.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer nav */}
        <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-5">
          <Button variant="ghost" onClick={back} disabled={step === 1 || submitting}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          <div className="flex items-center gap-2.5">
            {step < 5 ? (
              <Button onClick={next}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting} className="font-medium">
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Globe2 className="size-4" /> Submit investigation
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
