"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeftRight,
  ArrowUpRight,
  CircleCheck,
  GitBranch,
  Layers,
  Lightbulb,
  Network,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/app/page-header";
import {
  DemoBadge,
  EmptyState,
  ErrorState,
  PageSkeleton,
  SectionLabel,
  StatCard,
} from "@/components/shared/primitives";
import { CoveragePill, ImportanceBadge } from "@/components/shared/scores";
import { PartnerAvatar, Tag } from "@/components/shared/partner-visuals";
import { PartnerProfileContent } from "@/components/partners/partner-profile";
import { PortfolioGraph } from "@/components/portfolio/portfolio-graph";
import { useActiveAnalysisMeta, usePartners, usePortfolio } from "@/hooks/use-analysis";
import { truncate } from "@/lib/format";
import type { Partner } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export default function PortfolioPage() {
  const { entry, hasActive } = useActiveAnalysisMeta();
  const hasResults = hasActive && (entry!.status === "completed" || entry!.status === "partial");
  const partners = usePartners(hasResults ? entry!.id : null);
  const portfolio = usePortfolio(hasResults ? entry!.id : null);
  const reduce = useReducedMotion();
  const [drawerPartner, setDrawerPartner] = useState<Partner | null>(null);

  const data = portfolio.data;
  const partnerById = useMemo(
    () => new Map((partners.data?.partners ?? []).map((p) => [p.id, p])),
    [partners.data],
  );

  const coverageSummary = useMemo(() => {
    if (!data) return null;
    const supported = new Set(data.coverage.filter((c) => c.status === "supported").map((c) => c.capability_key));
    const partialOnly = new Set(
      data.coverage.filter((c) => c.status === "partial").map((c) => c.capability_key),
    );
    return {
      supported: supported.size,
      partial: [...partialOnly].filter((k) => !supported.has(k)).length,
      total: data.capabilities.length,
    };
  }, [data]);

  if (!hasActive || !hasResults) {
    return (
      <>
        <PageHeader title="Portfolio intelligence" />
        <EmptyState
          icon={<Network className="size-5" />}
          title={hasActive ? `Portfolio pending — investigation ${entry!.status}` : "No active investigation"}
          description="The optimizer output appears here once the investigation reaches a terminal state: selected partners, capability coverage and complementarity rationale."
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
        title="Portfolio intelligence"
        description={`The optimizer's complementary partner set for ${entry!.company} — why this combination, what it covers, what it risks.`}
        demo={entry!.demo}
      />

      {portfolio.loading && <PageSkeleton />}
      {portfolio.error && !portfolio.loading && <ErrorState description={portfolio.error} onRetry={portfolio.refetch} />}

      {data && !portfolio.loading && coverageSummary && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.4 }}
          className="space-y-6"
        >
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <StatCard label="Selected partners" value={data.selected.length} icon={<Layers className="size-3.5" />} tone="brand" hint="Chosen for complementary coverage" />
            <StatCard label="Capabilities supported" value={`${coverageSummary.supported}/${coverageSummary.total}`} icon={<CircleCheck className="size-3.5" />} tone="mint" hint="At least one strong contributor" />
            <StatCard label="Partial coverage" value={coverageSummary.partial} icon={<TriangleAlert className="size-3.5" />} tone="signal" hint="Contributions at moderate level only" />
            <StatCard label="Alternatives modelled" value={data.alternatives.length} icon={<ArrowLeftRight className="size-3.5" />} hint="Substitutions with coverage effects" />
          </div>

          {/* Interactive graph */}
          <section className="card-sheen rounded-xl border bg-surface-2/50 p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <SectionLabel>Capability graph</SectionLabel>
                <p className="mt-1 text-sm text-muted-foreground">
                  Required capabilities connected to selected partners. Hover or click a partner to trace its contributions.
                </p>
              </div>
              <Tag className="border-signal/25 text-signal">
                <Network className="mr-1 size-3" /> backend selection
              </Tag>
            </div>
            <PortfolioGraph
              portfolio={data}
              partners={partners.data?.partners ?? []}
              onOpenPartner={(p) => setDrawerPartner(p)}
            />
          </section>

          {/* A. Required capabilities */}
          <section className="card-sheen rounded-xl border bg-surface-2/50 p-5">
            <SectionLabel>Required capabilities</SectionLabel>
            <div className="mt-4 grid gap-2.5 md:grid-cols-2">
              {data.capabilities.map((c) => {
                const supportCount = data.coverage.filter((x) => x.capability_key === c.key && x.status === "supported").length;
                return (
                  <div key={c.key} className="rounded-lg border border-border/70 bg-surface-1/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13.5px] font-semibold text-foreground">{c.name}</p>
                      <ImportanceBadge importance={c.importance} />
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.rationale}</p>
                    <p className="mt-2.5 font-mono text-[11px] text-faint">
                      {supportCount} strong contributor{supportCount === 1 ? "" : "s"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* C. Coverage matrix */}
          <section className="card-sheen overflow-x-auto rounded-xl border bg-surface-2/50 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <SectionLabel>Capability coverage matrix</SectionLabel>
              <div className="flex items-center gap-3 text-[11px] text-faint">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-mint" /> supported</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-signal" /> partial</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-faint/40" /> not established</span>
              </div>
            </div>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/70">
                  <th className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-faint">Capability</th>
                  {data.selected.map((s) => {
                    const p = partnerById.get(s.partner_id);
                    return (
                      <th key={s.partner_id} className="pb-3 pr-4 text-center">
                        <button
                          type="button"
                          className="group mx-auto flex w-32 flex-col items-center gap-1.5"
                          onClick={() => p && setDrawerPartner(p)}
                        >
                          {p && <PartnerAvatar partner={p} size={30} className="mx-auto transition-transform group-hover:scale-105" />}
                          <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-muted-foreground group-hover:text-foreground">
                            {p?.name ?? s.partner_id}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.capabilities.map((c) => (
                  <tr key={c.key} className="border-b border-border/40 last:border-0">
                    <td className="py-3 pr-4">
                      <p className="text-[13px] font-medium text-foreground">{c.name}</p>
                    </td>
                    {data.selected.map((s) => {
                      const cell = data.coverage.find(
                        (x) => x.capability_key === c.key && x.partner_id === s.partner_id,
                      );
                      return (
                        <td key={s.partner_id} className="py-3 pr-4 text-center">
                          {cell ? (
                            <div className="flex flex-col items-center gap-1">
                              <CoveragePill status={cell.status} compact />
                              <span className="text-[10px] leading-tight text-faint">
                                {cell.status === "not_established" ? "—" : cell.status === "supported" ? "Strong" : "Partial"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* B + D. Selected partners & complementarity */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Selected partners */}
            <section className="card-sheen rounded-xl border bg-surface-2/50 p-5">
              <SectionLabel>Selected partners & contributions</SectionLabel>
              <div className="mt-4 space-y-3">
                {data.selected.map((s) => {
                  const p = partnerById.get(s.partner_id);
                  if (!p) return null;
                  return (
                    <button
                      key={s.partner_id}
                      type="button"
                      onClick={() => setDrawerPartner(p)}
                      className="w-full rounded-lg border border-border/70 bg-surface-1/60 p-4 text-left transition-all hover:border-brand/30 hover:bg-surface-3/50"
                    >
                      <div className="flex items-center gap-3">
                        <PartnerAvatar partner={p} size={38} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                          <p className="truncate text-xs text-faint">{p.hq} · fit {p.strategic_fit}</p>
                        </div>
                        <ArrowUpRight className="size-4 shrink-0 text-faint" />
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{truncate(s.rationale, 130)}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {s.contributions.map((c) => (
                          <span
                            key={c.capability_key}
                            className={cn(
                              "rounded-md border px-1.5 py-0.5 text-[10.5px]",
                              c.level === "strong"
                                ? "border-mint/30 bg-mint/10 text-mint"
                                : c.level === "moderate"
                                  ? "border-signal/30 bg-signal/10 text-signal"
                                  : "border-warn/30 bg-warn/10 text-warn",
                            )}
                          >
                            {c.level} · {c.capability_key.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Complementarity */}
            <section className="space-y-5">
              <div className="card-sheen rounded-xl border border-brand/25 bg-gradient-to-br from-brand/8 to-transparent p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg border border-brand/30 bg-brand/10 text-brand-soft">
                    <Lightbulb className="size-4" />
                  </span>
                  <h3 className="text-[15px] font-semibold text-foreground">Why this portfolio works</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.complementarity.narrative}</p>
              </div>

              <div className="card-sheen rounded-xl border bg-surface-2/50 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg border border-signal/25 bg-signal/10 text-signal">
                    <GitBranch className="size-4" />
                  </span>
                  <h3 className="text-[15px] font-semibold text-foreground">Better than the top individual scores</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.complementarity.vs_top_scores}</p>
              </div>

              {data.complementarity.redundancies.length > 0 && (
                <div className="card-sheen rounded-xl border bg-surface-2/50 p-5">
                  <SectionLabel>Redundant capabilities</SectionLabel>
                  <div className="mt-3 space-y-2.5">
                    {data.complementarity.redundancies.map((r, i) => (
                      <div key={i} className="rounded-lg border border-border/70 bg-surface-1/60 p-3.5">
                        <p className="text-[13px] font-medium text-foreground">
                          {data.capabilities.find((c) => c.key === r.capability_key)?.name ?? r.capability_key}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.note}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {r.partner_ids.map((pid) => (
                            <Tag key={pid}>{partnerById.get(pid)?.name ?? pid}</Tag>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.complementarity.gaps.length > 0 && (
                <div className="rounded-xl border border-warn/25 bg-warn/5 p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg border border-warn/30 bg-warn/10 text-warn">
                      <ShieldAlert className="size-4" />
                    </span>
                    <h3 className="text-[15px] font-semibold text-foreground">Missing coverage & risks</h3>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {data.complementarity.gaps.map((g, i) => (
                      <div key={i} className="rounded-lg border border-warn/20 bg-surface-1/60 p-3.5">
                        <p className="text-[13px] font-medium text-foreground">
                          {data.capabilities.find((c) => c.key === g.capability_key)?.name ?? g.capability_key}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{g.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* E. Alternatives */}
          {data.alternatives.length > 0 && (
            <section className="card-sheen rounded-xl border bg-surface-2/50 p-5">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <SectionLabel>Alternative partners & substitution effects</SectionLabel>
                <span className="text-[11px] text-faint">Computed by the backend optimizer — the frontend does not recalculate selections.</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                {data.alternatives.map((alt, i) => {
                  const out = partnerById.get(alt.replace_partner_id);
                  const inP = partnerById.get(alt.alternative_partner_id);
                  return (
                    <div key={i} className="rounded-lg border border-border/70 bg-surface-1/60 p-4">
                      <div className="flex items-center gap-2.5">
                        {out && <PartnerAvatar partner={out} size={28} className="opacity-60" />}
                        <ArrowLeftRight className="size-3.5 text-faint" />
                        {inP && <PartnerAvatar partner={inP} size={28} />}
                        <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                          {out?.name} → {inP?.name}
                        </p>
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{alt.effect}</p>
                      <div className="mt-3 space-y-1.5">
                        {alt.coverage_delta.map((d, j) => (
                          <div key={j} className="flex items-center justify-between gap-2 text-[11.5px]">
                            <span className="min-w-0 truncate text-faint">{d.capability_key.replace(/_/g, " ")}</span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-px font-medium",
                                d.change === "improved"
                                  ? "border-mint/30 bg-mint/10 text-mint"
                                  : d.change === "weakened"
                                    ? "border-danger/30 bg-danger/10 text-danger"
                                    : "border-border bg-muted/40 text-faint",
                              )}
                            >
                              {d.change}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <p className="text-center text-xs text-faint">
            Portfolio selection, coverage and alternatives are produced by the backend optimizer.
            {entry!.demo && " Current data source: demo engine (fictional records)."}
          </p>
        </motion.div>
      )}

      {/* Partner drawer */}
      <Sheet open={!!drawerPartner} onOpenChange={(o) => !o && setDrawerPartner(null)}>
        <SheetContent className="scrollbar-thin w-full overflow-y-auto border-border bg-background/98 sm:max-w-2xl">
          <SheetHeader className="pb-0">
            <SheetTitle className="flex items-center gap-2.5 text-base">
              <Layers className="size-4 text-brand-soft" /> Portfolio partner
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8">
            {drawerPartner && <PartnerProfileContent partner={drawerPartner} portfolio={data} analysisId={entry!.id} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
