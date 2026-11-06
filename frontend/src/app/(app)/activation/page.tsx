"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowUpRight,
  CalendarCheck,
  Check,
  CircleDollarSign,
  ClipboardCopy,
  Handshake,
  Mail,
  Rocket,
  Settings2,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/page-header";
import {
  DemoBadge,
  EmptyState,
  ErrorState,
  PageSkeleton,
  SectionLabel,
} from "@/components/shared/primitives";
import { PartnerAvatar, PersonCard } from "@/components/shared/partner-visuals";
import { useActivation, useActiveAnalysisMeta, usePartners } from "@/hooks/use-analysis";
import { useWorkspace } from "@/lib/store";
import type { ActivationPlan, RoadmapPhase } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const PHASES: { key: RoadmapPhase; label: string }[] = [
  { key: "week_1", label: "Week 1" },
  { key: "week_2", label: "Week 2" },
  { key: "week_3", label: "Week 3" },
  { key: "week_4", label: "Week 4" },
];

const OWNER_META = {
  you: { label: "You", className: "border-brand/30 bg-brand/10 text-brand-soft" },
  partner: { label: "Partner", className: "border-signal/30 bg-signal/10 text-signal" },
  joint: { label: "Joint", className: "border-mint/30 bg-mint/10 text-mint" },
} as const;

function Card({
  icon,
  title,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-sheen rounded-xl border bg-surface-2/50 p-5", className)}>
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-lg border border-border bg-surface-3 text-muted-foreground">{icon}</span>
        <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function RoadmapBoard({ plan, analysisId }: { plan: ActivationPlan; analysisId: string }) {
  // Select the stable parent object; deriving the per-plan map outside the
  // selector avoids a new reference per render (infinite-loop guard).
  const allCompletions = useWorkspace((s) => s.taskCompletions);
  const completions = allCompletions[`${analysisId}:${plan.partner_id}`] ?? {};
  const toggleTask = useWorkspace((s) => s.toggleTask);
  const done = plan.roadmap.filter((t) => completions[t.id]).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionLabel>30-day activation roadmap</SectionLabel>
        <span className="font-mono text-xs text-faint">
          {done}/{plan.roadmap.length} done · progress is stored locally
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {PHASES.map((phase, pi) => {
          const tasks = plan.roadmap.filter((t) => t.phase === phase.key);
          return (
            <div key={phase.key} className="rounded-xl border border-border/70 bg-surface-1/50 p-3">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-faint">{phase.label}</p>
                <span className="font-mono text-[10px] text-faint">{tasks.length}</span>
              </div>
              <div className="space-y-2">
                {tasks.map((t) => {
                  const complete = !!completions[t.id];
                  const owner = OWNER_META[t.owner];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTask(`${analysisId}:${plan.partner_id}`, t.id)}
                      aria-pressed={complete}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition-all",
                        complete
                          ? "border-mint/30 bg-mint/5 opacity-75"
                          : "border-border bg-surface-2/70 hover:border-brand/30",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors",
                            complete ? "border-mint bg-mint text-background" : "border-faint/40",
                          )}
                        >
                          {complete && <Check className="size-3" />}
                        </span>
                        <div className="min-w-0">
                          <p className={cn("text-[12.5px] font-medium leading-snug text-foreground", complete && "line-through decoration-mint/50")}>
                            {t.title}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-faint">{t.description}</p>
                          <span className={cn("mt-2 inline-block rounded-full border px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide", owner.className)}>
                            {owner.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {tasks.length === 0 && (
                  <p className="rounded-lg border border-dashed px-3 py-4 text-center text-[11px] text-faint">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ActivationPage() {
  const { entry, hasActive } = useActiveAnalysisMeta();
  const hasResults = hasActive && (entry!.status === "completed" || entry!.status === "partial");
  const partners = usePartners(hasResults ? entry!.id : null);
  const activation = useActivation(hasResults ? entry!.id : null);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const partnerById = useMemo(
    () => new Map((partners.data?.partners ?? []).map((p) => [p.id, p])),
    [partners.data],
  );

  const plans = activation.data?.activations ?? [];
  const currentPlan: ActivationPlan | null =
    plans.find((p) => p.partner_id === activePartnerId) ?? plans[0] ?? null;
  const currentPartner = currentPlan ? partnerById.get(currentPlan.partner_id) ?? null : null;

  const copyOutreach = async () => {
    if (!currentPlan) return;
    try {
      await navigator.clipboard.writeText(currentPlan.draft_outreach);
      toast.success("Outreach draft copied", { description: "Paste it into your mail client — nothing has been sent from ALLIOME." });
    } catch {
      toast.error("Copy failed", { description: "Your browser blocked clipboard access — select the text manually." });
    }
  };

  if (!hasActive || !hasResults) {
    return (
      <>
        <PageHeader title="Activation workspace" />
        <EmptyState
          icon={<Rocket className="size-5" />}
          title={hasActive ? `Activation pending — investigation ${entry!.status}` : "No active investigation"}
          description="Activation plans appear here once the investigation completes: joint solutions, outreach drafts and 30-day roadmaps per partner."
          action={
            <Button variant="outline" asChild>
              <Link href={hasActive ? `/investigations/${entry!.id}` : "/new"}>
                {hasActive ? "Track investigation" : "Start a brief"}
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Activation workspace"
        description={`Turn the ${entry!.company} portfolio into motion — joint solutions, outreach drafts and first-30-day plans.`}
        demo={entry!.demo}
      />

      {activation.loading && <PageSkeleton />}
      {activation.error && !activation.loading && <ErrorState description={activation.error} onRetry={activation.refetch} />}

      {activation.data && !activation.loading && plans.length === 0 && (
        <EmptyState
          icon={<Rocket className="size-5" />}
          title="No activation plans yet"
          description="The backend did not return activation plans for this analysis."
        />
      )}

      {activation.data && !activation.loading && currentPlan && currentPartner && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
          {/* Partner rail */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <SectionLabel className="mb-3">Selected partners</SectionLabel>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {plans.map((plan) => {
                const p = partnerById.get(plan.partner_id);
                if (!p) return null;
                const active = currentPlan.partner_id === plan.partner_id;
                return (
                  <button
                    key={plan.partner_id}
                    type="button"
                    onClick={() => setActivePartnerId(plan.partner_id)}
                    className={cn(
                      "flex min-w-[200px] items-center gap-3 rounded-xl border p-3 text-left transition-all lg:min-w-0",
                      active
                        ? "border-brand/45 bg-brand/10"
                        : "border-border bg-surface-2/50 hover:border-brand/25",
                    )}
                  >
                    <PartnerAvatar partner={p} size={34} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-foreground">{p.name}</p>
                      <p className="truncate text-[11px] text-faint">{plan.proposed_role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-xl border border-border/70 bg-surface-1/50 p-3.5">
              <p className="text-[11px] leading-relaxed text-faint">
                All outreach on this page is <span className="font-medium text-foreground">draft-only</span>. ALLIOME
                never sends communication and no partnership is assumed agreed.
              </p>
            </div>
          </aside>

          {/* Plan */}
          <motion.div
            key={currentPlan.partner_id}
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
            className="min-w-0 space-y-5"
          >
            {/* Header */}
            <div className="card-sheen rounded-xl border bg-surface-2/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <PartnerAvatar partner={currentPartner} size={52} />
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{currentPartner.name}</h2>
                    <Badge variant="outline" className="mt-1.5 h-auto whitespace-normal break-words border-brand/30 bg-brand/10 text-left text-brand-soft">
                      <Handshake className="mr-1 size-3 shrink-0" /> {currentPlan.proposed_role}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/partners/${currentPartner.id}?analysis=${entry!.id}`}>
                    Partner profile <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{currentPlan.rationale}</p>
            </div>

            {/* Value cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card icon={<Handshake className="size-3.5" />} title="Why the partner benefits">
                <p className="text-[13px] leading-relaxed text-muted-foreground">{currentPlan.partner_benefit}</p>
              </Card>
              <Card icon={<Target className="size-3.5" />} title="Joint value proposition">
                <p className="text-[13px] leading-relaxed text-muted-foreground">{currentPlan.joint_value_proposition}</p>
              </Card>
              <Card icon={<Settings2 className="size-3.5" />} title="Proposed joint solution">
                <p className="text-[13px] leading-relaxed text-muted-foreground">{currentPlan.joint_solution}</p>
              </Card>
              <Card icon={<Users className="size-3.5" />} title="Target customer profile">
                <p className="text-[13px] leading-relaxed text-muted-foreground">{currentPlan.target_customer_profile}</p>
              </Card>
              <Card icon={<Rocket className="size-3.5" />} title="Pilot / proof-of-concept scope">
                <p className="text-[13px] leading-relaxed text-muted-foreground">{currentPlan.pilot_scope}</p>
              </Card>
              <Card icon={<CircleDollarSign className="size-3.5" />} title="Commercial model hypothesis">
                <p className="text-[13px] leading-relaxed text-muted-foreground">{currentPlan.commercial_model}</p>
              </Card>
            </div>

            {/* Metrics + dependencies */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card icon={<Target className="size-3.5" />} title="Success metrics">
                <ul className="space-y-2">
                  {currentPlan.success_metrics.map((m, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mint" />
                      {m}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card icon={<Settings2 className="size-3.5" />} title="Technical dependencies">
                <ul className="space-y-2">
                  {currentPlan.technical_dependencies.map((d, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal" />
                      {d}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Decision makers */}
            <Card icon={<Users className="size-3.5" />} title="Relevant decision-makers">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {currentPartner.decision_makers
                  .filter((dm) => currentPlan.decision_maker_ids.includes(dm.id))
                  .map((dm) => (
                    <PersonCard key={dm.id} person={dm} evidence={currentPartner.evidence} />
                  ))}
              </div>
            </Card>

            {/* Draft outreach */}
            <Card icon={<Mail className="size-3.5" />} title="Draft outreach — not sent">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge variant="outline" className="border-warn/30 bg-warn/10 text-warn">Draft · nothing has been sent</Badge>
                <Button size="sm" variant="outline" onClick={copyOutreach}>
                  <ClipboardCopy className="size-3.5" /> Copy draft
                </Button>
              </div>
              <pre className="scrollbar-thin max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/70 bg-surface-1/70 p-4 font-sans text-[13px] leading-relaxed text-muted-foreground">
                {currentPlan.draft_outreach}
              </pre>
            </Card>

            {/* Meeting agenda */}
            <Card icon={<CalendarCheck className="size-3.5" />} title="First meeting agenda">
              <ol className="space-y-2.5">
                {currentPlan.meeting_agenda.map((a, i) => (
                  <li key={i} className="flex items-baseline gap-3 text-[13px] leading-relaxed text-muted-foreground">
                    <span className="font-mono text-[11px] font-semibold text-brand-soft">{String(i + 1).padStart(2, "0")}</span>
                    {a}
                  </li>
                ))}
              </ol>
            </Card>

            {/* Roadmap */}
            <div className="card-sheen rounded-xl border bg-surface-2/50 p-5">
              <RoadmapBoard plan={currentPlan} analysisId={entry!.id} />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
