"use client";

import { useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUpRight,
  CircleCheck,
  FileText,
  Printer,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import {
  DemoBadge,
  EmptyState,
  ErrorState,
  PageSkeleton,
} from "@/components/shared/primitives";
import { LogoMark } from "@/components/brand/logo";
import { useActivation, useActiveAnalysisMeta, useAnalysis, usePartners, usePortfolio } from "@/hooks/use-analysis";
import { formatDate, partnerTypeLabel } from "@/lib/format";

export default function ReportsPage() {
  const { entry, hasActive } = useActiveAnalysisMeta();
  const hasResults = hasActive && (entry!.status === "completed" || entry!.status === "partial");
  const analysis = useAnalysis(hasActive ? entry!.id : null);
  const partners = usePartners(hasResults ? entry!.id : null);
  const portfolio = usePortfolio(hasResults ? entry!.id : null);
  const activation = useActivation(hasResults ? entry!.id : null);

  const loading = partners.loading || portfolio.loading || activation.loading;
  const data = useMemo(() => {
    if (!partners.data || !portfolio.data || !activation.data) return null;
    return { partners: partners.data, portfolio: portfolio.data, activation: activation.data };
  }, [partners.data, portfolio.data, activation.data]);

  const print = () => {
    try {
      window.print();
      toast.success("Print dialog opened", { description: "Choose “Save as PDF” to export the executive report." });
    } catch {
      toast.error("Print is not available in this environment.");
    }
  };

  if (!hasActive || !hasResults) {
    return (
      <>
        <PageHeader title="Executive report" />
        <EmptyState
          icon={<FileText className="size-5" />}
          title={hasActive ? `Report pending — investigation ${entry!.status}` : "No active investigation"}
          description="The executive report is generated from completed investigation results."
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

  const brief = analysis.data?.brief;

  return (
    <>
      {/* Screen header (hidden in print) */}
      <div className="print-hide">
        <PageHeader
          title="Executive report"
          description={`Board-ready summary of the ${entry!.company} market-entry investigation.`}
          demo={entry!.demo}
          actions={
            <Button size="sm" onClick={print}>
              <Printer className="size-3.5" /> Export PDF / print
            </Button>
          }
        />
      </div>

      {loading && <PageSkeleton />}
      {(partners.error || portfolio.error) && !loading && (
        <ErrorState description={partners.error ?? portfolio.error ?? "Failed to load"} onRetry={() => { partners.refetch(); portfolio.refetch(); }} />
      )}

      {data && !loading && (
        <div className="print-report space-y-6">
          {/* Report cover header */}
          <header className="print-card card-sheen rounded-xl border bg-surface-2/50 p-7 print-page-break">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <LogoMark size={28} />
                  <span className="text-sm font-semibold tracking-tight print-text">ALLIOME · Executive report</span>
                </div>
                <h1 className="print-text mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Market-entry ecosystem: {entry!.company}
                </h1>
                <p className="print-muted mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Partner investigation for <span className="font-medium text-foreground print-text">{brief?.company.product_name ?? entry!.product}</span> —{" "}
                  {brief?.target_market.geography ?? entry!.geography}, {brief?.target_market.industry ?? entry!.industry}.
                </p>
              </div>
              <div className="text-right text-xs text-faint print-muted">
                <p>Report generated</p>
                <p className="mt-0.5 font-mono text-[13px] text-foreground print-text">{formatDate(new Date().toISOString())}</p>
                <p className="mt-3">Analysis ID</p>
                <p className="mt-0.5 font-mono text-[11px] text-foreground print-text">{entry!.id}</p>
                {entry!.demo && <div className="mt-3"><DemoBadge /></div>}
              </div>
            </div>

            {/* Key numbers */}
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Candidates discovered", String(data.partners.partners.length)],
                ["Investigated", String(data.partners.partners.length)],
                ["Portfolio selected", String(data.portfolio.selected.length)],
                ["Capabilities covered", `${new Set(data.portfolio.coverage.filter((c) => c.status === "supported").map((c) => c.capability_key)).size}/${data.portfolio.capabilities.length}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border/70 bg-surface-1/60 p-3.5 print-card">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-faint print-muted">{label}</p>
                  <p className="print-text mt-1.5 font-mono text-xl font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </header>

          {/* 1. Market-entry brief */}
          <section className="print-card card-sheen rounded-xl border bg-surface-2/50 p-6 print-page-break">
            <h2 className="print-text text-lg font-semibold text-foreground">1 · Company & market-entry brief</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-faint print-muted">Product</p>
                <p className="print-text mt-1 text-sm font-medium text-foreground">{brief?.company.product_name}</p>
                <p className="print-muted mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{brief?.company.product_description}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-faint print-muted">Objective</p>
                <p className="print-muted mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{brief?.target_market.objective}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-faint print-muted">Ideal customer</p>
                <p className="print-muted mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{brief?.target_market.ideal_customer || "—"}</p>
              </div>
            </div>
          </section>

          {/* 2. Capability requirements */}
          <section className="print-card card-sheen rounded-xl border bg-surface-2/50 p-6 print-page-break">
            <h2 className="print-text text-lg font-semibold text-foreground">2 · Capability requirements</h2>
            <div className="mt-4 space-y-2">
              {data.portfolio.capabilities.map((c) => (
                <div key={c.key} className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-surface-1/50 p-3.5 print-card">
                  <div className="min-w-0">
                    <p className="print-text text-[13.5px] font-medium text-foreground">{c.name}</p>
                    <p className="print-muted mt-0.5 text-xs leading-relaxed text-muted-foreground">{c.rationale}</p>
                  </div>
                  <span className="print-text shrink-0 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-soft">{c.importance}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Investigated partners */}
          <section className="print-card card-sheen overflow-x-auto rounded-xl border bg-surface-2/50 p-6 print-page-break">
            <h2 className="print-text text-lg font-semibold text-foreground">3 · Candidate discovery & investigation results</h2>
            <table className="mt-4 w-full min-w-[620px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border print-muted text-[11px] uppercase tracking-wider text-faint">
                  <th className="pb-2.5 pr-4">Company</th>
                  <th className="pb-2.5 pr-4">Category</th>
                  <th className="pb-2.5 pr-4 text-right">Strategic fit</th>
                  <th className="pb-2.5 pr-4 text-right">Readiness</th>
                  <th className="pb-2.5 pr-4">Evidence</th>
                  <th className="pb-2.5">Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {[...data.partners.partners]
                  .sort((a, b) => b.strategic_fit - a.strategic_fit)
                  .map((p) => {
                    const selected = data.portfolio.selected.some((s) => s.partner_id === p.id);
                    return (
                      <tr key={p.id} className="border-b border-border/40 print-card">
                        <td className="py-2.5 pr-4">
                          <span className="print-text font-medium text-foreground">{p.name}</span>
                          <span className="print-muted block text-[11px] text-faint">{p.hq}</span>
                        </td>
                        <td className="print-muted py-2.5 pr-4 text-muted-foreground">{partnerTypeLabel(p.category)}</td>
                        <td className="print-text py-2.5 pr-4 text-right font-mono">{p.strategic_fit}</td>
                        <td className="print-text py-2.5 pr-4 text-right font-mono">{p.activation_readiness}</td>
                        <td className="print-muted py-2.5 pr-4">{p.evidence_confidence}</td>
                        <td className="py-2.5">
                          {selected ? (
                            <span className="print-text inline-flex items-center gap-1 text-mint"><CircleCheck className="size-3.5" /> selected</span>
                          ) : (
                            <span className="print-muted text-faint">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {data.partners.partial && (
              <p className="print-muted mt-3 flex items-center gap-2 text-xs text-warn">
                <TriangleAlert className="size-3.5" /> Partial results — {data.partners.partial.reason}
              </p>
            )}
          </section>

          {/* 4. Coverage matrix */}
          <section className="print-card card-sheen overflow-x-auto rounded-xl border bg-surface-2/50 p-6 print-page-break">
            <h2 className="print-text text-lg font-semibold text-foreground">4 · Portfolio capability coverage</h2>
            <table className="mt-4 w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border print-muted text-[11px] uppercase tracking-wider text-faint">
                  <th className="pb-2.5 pr-4">Capability</th>
                  {data.portfolio.selected.map((s) => (
                    <th key={s.partner_id} className="pb-2.5 pr-3">
                      {data.partners.partners.find((p) => p.id === s.partner_id)?.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.portfolio.capabilities.map((c) => (
                  <tr key={c.key} className="border-b border-border/40 print-card">
                    <td className="print-text py-2.5 pr-4 font-medium text-foreground">{c.name}</td>
                    {data.portfolio.selected.map((s) => {
                      const cell = data.portfolio.coverage.find((x) => x.capability_key === c.key && x.partner_id === s.partner_id);
                      const label = cell?.status === "supported" ? "Supported" : cell?.status === "partial" ? "Partial" : "—";
                      return (
                        <td key={s.partner_id} className="print-text py-2.5 pr-3 text-muted-foreground">{label}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="print-muted mt-4 text-[13px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground print-text">Why this portfolio: </span>
              {data.portfolio.complementarity.vs_top_scores}
            </p>
          </section>

          {/* 5. Missing information */}
          <section className="print-card card-sheen rounded-xl border bg-surface-2/50 p-6 print-page-break">
            <h2 className="print-text flex items-center gap-2 text-lg font-semibold text-foreground">
              5 · Missing information & risks
              <ShieldAlert className="size-4 text-warn" />
            </h2>
            <div className="mt-4 space-y-2.5">
              {data.portfolio.complementarity.gaps.map((g, i) => (
                <div key={i} className="rounded-lg border border-warn/25 bg-warn/5 p-3.5 print-card">
                  <p className="print-text text-[13px] font-medium text-foreground">
                    {data.portfolio.capabilities.find((c) => c.key === g.capability_key)?.name ?? g.capability_key}
                  </p>
                  <p className="print-muted mt-0.5 text-xs leading-relaxed text-muted-foreground">{g.note}</p>
                </div>
              ))}
              {data.partners.partners
                .filter((p) => data.portfolio.selected.some((s) => s.partner_id === p.id) && p.unknowns.length > 0)
                .map((p) => (
                  <div key={p.id} className="rounded-lg border border-border/60 bg-surface-1/50 p-3.5 print-card">
                    <p className="print-text text-[13px] font-medium text-foreground">{p.name} — open unknowns</p>
                    <ul className="print-muted mt-1.5 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                      {p.unknowns.map((u, i) => <li key={i}>{u}</li>)}
                    </ul>
                  </div>
                ))}
            </div>
          </section>

          {/* 6. Joint solution blueprint + roadmap */}
          <section className="print-card card-sheen rounded-xl border bg-surface-2/50 p-6 print-page-break">
            <h2 className="print-text text-lg font-semibold text-foreground">6 · Joint solution blueprint & activation</h2>
            <div className="mt-4 space-y-4">
              {data.activation.activations.map((plan) => {
                const p = data.partners.partners.find((x) => x.id === plan.partner_id);
                return (
                  <div key={plan.partner_id} className="rounded-xl border border-border/70 bg-surface-1/50 p-5 print-card">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="print-text text-[15px] font-semibold text-foreground">{p?.name}</p>
                      <span className="print-text rounded-full border border-brand/25 bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-soft">{plan.proposed_role}</span>
                    </div>
                    <p className="print-muted mt-2 text-[13px] leading-relaxed text-muted-foreground">{plan.joint_value_proposition}</p>
                    <p className="print-muted mt-1.5 text-xs leading-relaxed text-faint"><span className="font-medium">Pilot:</span> {plan.pilot_scope}</p>
                    <div className="mt-3 border-t border-border/50 pt-3">
                      <p className="print-muted text-[11px] font-semibold uppercase tracking-wider text-faint">30-day roadmap</p>
                      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {plan.roadmap.slice(0, 6).map((t) => (
                          <p key={t.id} className="print-muted flex gap-2 text-xs text-muted-foreground">
                            <span className="font-mono text-[10px] text-faint">{t.phase.replace("week_", "W")}</span>
                            {t.title} <span className="text-faint">({t.owner})</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="print-muted flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-[11px] text-faint">
            <p>
              ALLIOME · Evidence-based ecosystem intelligence. Every claim links to its source in the workspace.
              {entry!.demo && " This report contains synthetic demo data."}
            </p>
            <Link href="/portfolio" className="inline-flex items-center gap-1 text-signal hover:text-brand-soft print-hide">
              Open portfolio workspace <ArrowUpRight className="size-3.5" />
            </Link>
          </footer>
        </div>
      )}
    </>
  );
}
