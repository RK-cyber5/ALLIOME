"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Circle,
  CircleCheck,
  CircleDashed,
  Clock,
  FileText,
  Layers,
  Loader2,
  Network,
  RefreshCw,
  Rocket,
  Search,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { StatusChip } from "@/components/app/topbar";
import { DemoBadge, ErrorState, PageSkeleton, SectionLabel } from "@/components/shared/primitives";
import { useInvestigation } from "@/hooks/use-analysis";
import { entryFromBrief, useWorkspace } from "@/lib/store";
import { submitBrief, isTerminal, IS_DEMO } from "@/lib/api/client";
import { formatDateTime, timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AnalysisStage } from "@/lib/api/types";

const STAGE_NUMBER: Record<string, number> = {
  analysing_company: 1,
  compiling_capability_gaps: 2,
  discovering_partners: 3,
  investigating_capabilities: 4,
  identifying_decision_makers: 5,
  collecting_evidence: 6,
  evaluating_fit: 7,
  optimising_portfolio: 8,
  generating_activation: 9,
};

function StageIcon({ status }: { status: AnalysisStage["status"] }) {
  switch (status) {
    case "completed":
      return <CircleCheck className="size-4.5 text-mint" />;
    case "running":
      return <Loader2 className="size-4.5 animate-spin text-signal" />;
    case "failed":
      return <XCircle className="size-4.5 text-danger" />;
    case "skipped":
      return <CircleDashed className="size-4.5 text-faint" />;
    default:
      return <Circle className="size-4.5 text-faint/50" />;
  }
}

export default function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { analysis, error, refetch } = useInvestigation(id);
  const { analyses, upsertAnalysis, setActive } = useWorkspace();
  const reduce = useReducedMotion();

  const progress = analysis?.progress ?? 0;

  const retry = async () => {
    if (!analysis) return;
    try {
      const res = await submitBrief(analysis.brief);
      upsertAnalysis(entryFromBrief(res.analysis_id, analysis.brief, "queued", IS_DEMO));
      setActive(res.analysis_id);
      toast.success("Investigation resubmitted", { description: "A new run has been queued with the same brief." });
      window.location.href = `/investigations/${res.analysis_id}`;
    } catch (err) {
      toast.error("Resubmission failed", { description: err instanceof Error ? err.message : undefined });
    }
  };

  if (error) {
    return (
      <>
        <PageHeader title="Investigation" description={`Run ${id}`} />
        <ErrorState title="Could not load this investigation" description={error} onRetry={refetch} />
      </>
    );
  }

  if (!analysis) return <PageSkeleton />;

  const terminal = isTerminal(analysis.status);
  const entry = analyses.find((a) => a.id === id);
  const resultsAvailable = analysis.status === "completed" || analysis.status === "partial";

  return (
    <>
      <PageHeader
        title={
          <>
            {analysis.brief.company.name || "Investigation"} — {analysis.brief.company.product_name || "Product"}
          </>
        }
        description={
          <>
            {analysis.brief.target_market.geography || "Market"} · {analysis.brief.target_market.industry || "—"} ·{" "}
            started {timeAgo(analysis.created_at)}
          </>
        }
        demo={analysis.demo}
        actions={<StatusChip status={analysis.status} />}
      />

      {/* Status banners */}
      {analysis.status === "queued" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 px-4 py-3.5">
          <Clock className="size-4 shrink-0 text-faint" />
          <p className="text-sm text-muted-foreground">
            Queued — the backend will pick up this investigation shortly.
          </p>
        </div>
      )}
      {analysis.status === "running" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-signal/25 bg-signal/5 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Loader2 className="size-4 animate-spin text-signal" />
            <p className="text-sm text-muted-foreground">
              Investigation running — {analysis.stage.replace(/_/g, " ")} at {progress}%. This page updates live.
            </p>
          </div>
          <span className="font-mono text-2xl font-bold text-signal">{progress}%</span>
        </div>
      )}
      {analysis.status === "completed" && (
        <div className="mb-6 rounded-xl border border-mint/25 bg-mint/5 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CircleCheck className="size-4.5 shrink-0 text-mint" />
              <p className="text-sm text-muted-foreground">
                Investigation complete — FastAPI reported {progress}%. Results are ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button size="sm" asChild>
                <Link href="/discovery">
                  <Search className="size-3.5" /> View partners
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/portfolio">
                  <Network className="size-3.5" /> Portfolio
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/activation">
                  <Rocket className="size-3.5" /> Activation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
      {analysis.status === "partial" && (
        <div className="mb-6 rounded-xl border border-warn/30 bg-warn/5 px-4 py-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0 text-warn" />
            <div>
              <p className="text-sm font-medium text-foreground">Partial results available</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                The investigation finished with degraded evidence coverage. Partner, portfolio and activation results
                below may contain gaps — missing items are labelled on each screen.
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/discovery">
                    <Search className="size-3.5" /> View partial results
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={retry}>
                  <RefreshCw className="size-3.5" /> Re-run investigation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {analysis.status === "failed" && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/5 px-4 py-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 size-4.5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-medium text-foreground">Investigation failed</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {analysis.error?.message ?? "The backend reported an unrecoverable error."}
                {analysis.error?.stage ? ` (stage: ${analysis.error.stage})` : ""}
                {analysis.error ? ` · code: ${analysis.error.code}` : ""}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <Button size="sm" onClick={retry}>
                  <RefreshCw className="size-3.5" /> Retry with same brief
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/new">Edit brief</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {analysis.status === "cancelled" && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/60 px-4 py-3.5">
          <p className="text-sm text-muted-foreground">
            This investigation was cancelled. You can re-run it with the same brief.
          </p>
          <Button size="sm" variant="outline" onClick={retry}>
            <RefreshCw className="size-3.5" /> Re-run
          </Button>
        </div>
      )}

      {analysis.warnings.length > 0 && (
        <div className="mb-6 rounded-xl border border-warn/30 bg-warn/5 px-4 py-4">
          <p className="text-sm font-medium text-foreground">Backend warnings</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {analysis.warnings.map((warning, index) => <li key={`${warning.code}-${index}`}>{warning.message} <span className="font-mono text-xs text-faint">({warning.code})</span></li>)}
          </ul>
        </div>
      )}
      {analysis.errors.length > 0 && analysis.status !== "failed" && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger/5 px-4 py-4">
          <p className="text-sm font-medium text-foreground">Backend errors</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {analysis.errors.map((item, index) => <li key={`${item.code}-${index}`}>{item.message} <span className="font-mono text-xs text-faint">({item.code})</span></li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Stage tracker */}
        <section className="card-sheen rounded-xl border bg-surface-2/50 p-5">
          <div className="mb-5 flex items-center justify-between">
            <SectionLabel>Workflow stages</SectionLabel>
            <span className="font-mono text-xs text-faint">
              {progress}% reported by FastAPI
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand via-brand to-signal"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduce ? 0 : 0.7, ease: "easeOut" }}
            />
          </div>

          <ol className="relative space-y-1">
            {analysis.stages.map((stage, i) => (
              <motion.li
                key={stage.key}
                initial={{ opacity: 0, x: reduce ? 0 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : i * 0.04 }}
                className={cn(
                  "relative flex items-start gap-3.5 rounded-lg px-3 py-2.5 transition-colors",
                  stage.status === "running" && "bg-signal/5 shadow-[inset_0_0_0_1px_rgba(168,127,46,0.2)]",
                  stage.status === "failed" && "bg-danger/5",
                )}
              >
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center">
                  <StageIcon status={stage.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p
                      className={cn(
                        "text-[13.5px] font-medium leading-snug",
                        stage.status === "pending" ? "text-faint" : "text-foreground",
                      )}
                    >
                      <span className="mr-2 font-mono text-[11px] text-faint">
                        {String(STAGE_NUMBER[stage.key] ?? i + 1).padStart(2, "0")}
                      </span>
                      {stage.label}
                    </p>
                    {stage.completed_at && (
                      <span className="shrink-0 font-mono text-[10.5px] text-faint">
                        {formatDateTime(stage.completed_at)}
                      </span>
                    )}
                  </div>
                  {stage.detail && (
                    <p
                      className={cn(
                        "mt-1 text-xs leading-relaxed",
                        stage.status === "running" ? "text-signal/90" : "text-muted-foreground",
                      )}
                    >
                      {stage.detail}
                      {stage.status === "running" && "…"}
                    </p>
                  )}
                </div>
              </motion.li>
            ))}
          </ol>
        </section>

        {/* Brief + activity */}
        <div className="space-y-5">
          <section className="card-sheen rounded-xl border bg-surface-2/50 p-5">
            <SectionLabel>Market-entry brief</SectionLabel>
            <dl className="mt-3.5 space-y-3">
              {[
                ["Company", `${analysis.brief.company.name}${analysis.brief.company.website ? ` · ${analysis.brief.company.website.replace(/^https?:\/\//, "")}` : ""}`],
                ["Product", analysis.brief.company.product_name],
                ["Market", `${analysis.brief.target_market.geography} · ${analysis.brief.target_market.industry}`],
                ["Objective", analysis.brief.target_market.objective],
                ["Capabilities", `${analysis.brief.required_capabilities.length} required`],
                ["Partner types", analysis.brief.partner_types.length ? analysis.brief.partner_types.map((t) => t.replace(/_/g, " ")).join(", ") : "—"],
                ["Scope", `${analysis.brief.max_candidates} candidates max`],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 text-[13px]">
                  <dt className="w-24 shrink-0 text-faint">{k}</dt>
                  <dd className="min-w-0 flex-1 leading-relaxed text-muted-foreground">{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card-sheen rounded-xl border bg-surface-2/50 p-5">
            <SectionLabel>Activity</SectionLabel>
            <div className="scrollbar-thin mt-3.5 max-h-64 space-y-3 overflow-y-auto pr-1">
              {analysis.stages
                .filter((s) => s.started_at)
                .sort((a, b) => new Date(b.started_at!).getTime() - new Date(a.started_at!).getTime())
                .map((s) => (
                  <div key={s.key} className="flex items-start gap-2.5 text-[12.5px]">
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        s.status === "completed" ? "bg-mint" : s.status === "running" ? "animate-pulse bg-signal" : s.status === "failed" ? "bg-danger" : "bg-faint",
                      )}
                    />
                    <div>
                      <p className="leading-snug text-muted-foreground">
                        <span className="font-medium text-foreground">{s.label}</span>
                        {s.status === "completed" ? " — done" : s.status === "running" ? " — in progress" : s.status === "failed" ? " — failed" : ""}
                      </p>
                      <p className="mt-0.5 font-mono text-[10.5px] text-faint">{formatDateTime(s.started_at!)}</p>
                    </div>
                  </div>
                ))}
              {analysis.stages.every((s) => !s.started_at) && (
                <p className="text-sm text-faint">Waiting for the backend to start the first stage…</p>
              )}
            </div>
          </section>

          {resultsAvailable && entry?.demo && (
            <div className="rounded-xl border border-warn/25 bg-warn/5 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <DemoBadge />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                These results come from the built-in demo engine: the companies, people and evidence are fictional.
                Connect the FastAPI backend for live research.
              </p>
            </div>
          )}

          {resultsAvailable && (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/reports">
                <FileText className="size-4" /> Open executive report <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
