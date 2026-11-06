"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CircleCheck,
  FileSearch,
  Layers,
  PlusCircle,
  Radar,
  Radio,
  Rocket,
  Search,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { StatusChip } from "@/components/app/topbar";
import {
  DemoBadge,
  EmptyState,
  ErrorState,
  PageSkeleton,
  SectionLabel,
  StatCard,
} from "@/components/shared/primitives";
import { PartnerAvatar } from "@/components/shared/partner-visuals";
import { useActivation, useActiveAnalysisMeta, usePartners, usePortfolio } from "@/hooks/use-analysis";
import { useWorkspace } from "@/lib/store";
import { IS_DEMO } from "@/lib/api/client";
import { DEMO_SIGNALS } from "@/lib/api/demo-results";
import { timeAgo, truncate } from "@/lib/format";
import type { PartnerSignal } from "@/lib/api/types";

const SIGNAL_ICONS: Record<PartnerSignal["type"], React.ReactNode> = {
  hiring: <UserCheck className="size-3.5" />,
  content: <FileSearch className="size-3.5" />,
  partnership: <Layers className="size-3.5" />,
  leadership: <Briefcase className="size-3.5" />,
  event: <Radio className="size-3.5" />,
};

export default function OverviewPage() {
  const { entry, hasActive } = useActiveAnalysisMeta();
  const analyses = useWorkspace((s) => s.analyses);
  const setActive = useWorkspace((s) => s.setActive);
  const taskCompletions = useWorkspace((s) => s.taskCompletions);

  const hasResults = hasActive && (entry?.status === "completed" || entry?.status === "partial");
  const partners = usePartners(hasResults ? entry!.id : null);
  const portfolio = usePortfolio(hasResults ? entry!.id : null);
  const activation = useActivation(hasResults ? entry!.id : null);

  const stats = useMemo(() => {
    if (!partners.data || !portfolio.data || !activation.data) return null;
    const discovered = partners.data.partners.length;
    const investigated = partners.data.partners.length; // all returned partners were investigated
    const selected = portfolio.data.selected.length;
    const capsWithSupport = new Set(
      portfolio.data.coverage.filter((c) => c.status === "supported").map((c) => c.capability_key),
    );
    const totalCaps = portfolio.data.capabilities.length;
    const coverage = totalCaps ? Math.round((capsWithSupport.size / totalCaps) * 100) : 0;
    const totalTasks = activation.data.activations.reduce((n, a) => n + a.roadmap.length, 0);
    const doneTasks = activation.data.activations.reduce(
      (n, a) => n + a.roadmap.filter((t) => taskCompletions[`${entry!.id}:${a.partner_id}`]?.[t.id]).length,
      0,
    );
    return { discovered, investigated, selected, coverage, openTasks: totalTasks - doneTasks, totalTasks };
  }, [partners.data, portfolio.data, activation.data, taskCompletions, entry]);

  const loading = hasResults && (!partners.loading || !portfolio.loading) && !stats && !partners.error && !portfolio.error;

  if (!hasActive) {
    return (
      <>
        <PageHeader title="Overview" description="Your workspace at a glance." />
        <EmptyState
          icon={<Radar className="size-5" />}
          title="No active investigation"
          description="Start a market-entry brief or open an existing investigation to see ecosystem intelligence here."
          action={
            <div className="flex gap-2.5">
              <Button asChild>
                <Link href="/new">
                  <PlusCircle className="size-4" /> New ecosystem
                </Link>
              </Button>
              {analyses[0] && (
                <Button variant="outline" onClick={() => setActive(analyses[0].id)}>
                  Open latest
                </Button>
              )}
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Overview"
        description={
          <>
            {entry!.company} — {entry!.product} · {entry!.geography} &nbsp;
            <StatusChip status={entry!.status} />
          </>
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/investigations/${entry!.id}`}>
              <Radar className="size-3.5" /> Open investigation
            </Link>
          </Button>
        }
      />

      {!hasResults && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-signal/25 bg-signal/5 px-4 py-3.5">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{entry!.company}</span> — investigation {entry!.status}. Results appear here once the backend reaches a terminal state.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/investigations/${entry!.id}`}>
              Track progress <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {hasResults && loading && <PageSkeleton />}

      {hasResults && partners.error && (
        <ErrorState description={partners.error} onRetry={partners.refetch} />
      )}

      {hasResults && stats && (
        <>
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
            <StatCard label="Partners discovered" value={stats.discovered} hint="Candidates surfaced by the discovery stage" icon={<Search className="size-3.5" />} />
            <StatCard label="Partners investigated" value={stats.investigated} hint="Capability-verified companies" icon={<FileSearch className="size-3.5" />} tone="signal" />
            <StatCard label="Selected portfolio" value={stats.selected} hint="Complementary partner set" icon={<Layers className="size-3.5" />} tone="brand" />
            <StatCard label="Capability coverage" value={`${stats.coverage}%`} hint="Required capabilities fully supported" icon={<CircleCheck className="size-3.5" />} tone="mint" />
            <StatCard label="Open activation tasks" value={stats.openTasks} hint={`of ${stats.totalTasks} roadmap tasks`} icon={<Rocket className="size-3.5" />} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
            {/* Selected portfolio preview */}
            <section className="card-sheen rounded-xl border bg-surface-2/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <SectionLabel>Selected portfolio</SectionLabel>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The complementary partner set — {entry!.company}&apos;s ecosystem for {entry!.geography}.
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/portfolio">
                    Open <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {portfolio.data!.selected.map((s) => {
                  const p = partners.data!.partners.find((x) => x.id === s.partner_id);
                  if (!p) return null;
                  return (
                    <Link
                      key={s.partner_id}
                      href={`/partners/${p.id}?analysis=${entry!.id}`}
                      className="group flex items-center gap-3 rounded-lg border border-border/70 bg-surface-3/40 p-3 transition-all hover:border-brand/30 hover:bg-surface-3/70"
                    >
                      <PartnerAvatar partner={p} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                        <p className="truncate text-xs text-faint">{truncate(s.rationale, 84)}</p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-mint">{p.strategic_fit}</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Recent signals */}
            <section className="card-sheen rounded-xl border bg-surface-2/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <SectionLabel>Partner signals</SectionLabel>
                  <p className="mt-1 text-sm text-muted-foreground">Market movement across tracked partners.</p>
                </div>
                {IS_DEMO && <DemoBadge tooltip="Synthetic demo feed — the live feed is provided by backend intelligence." />}
              </div>
              {IS_DEMO ? (
                <div className="scrollbar-thin mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {DEMO_SIGNALS.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-start gap-3 rounded-lg border border-border/70 bg-surface-3/40 p-3">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-signal/25 bg-signal/10 text-signal">
                        {SIGNAL_ICONS[s.type]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] leading-snug text-foreground">{truncate(s.text, 110)}</p>
                        <p className="mt-1 text-[11px] text-faint">
                          {s.partner_name} · {timeAgo(s.observed_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="mt-4 py-10"
                  title="Signals feed — not available yet"
                  description="Live partner signals require a backend feed endpoint that is not part of the current API contract. It will appear here as soon as the backend ships it."
                />
              )}
            </section>
          </div>
        </>
      )}

      {/* Recent investigations */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Recent ecosystem investigations</SectionLabel>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/investigations">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border bg-surface-2/50">
          {analyses.slice(0, 5).map((a) => (
            <Link
              key={a.id}
              href={`/investigations/${a.id}`}
              className="flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-0 hover:bg-surface-3/40"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-surface-3 text-[11px] font-bold text-brand-soft">
                {(a.company || "?").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{a.company} — {a.product}</p>
                <p className="truncate text-xs text-faint">{a.geography} · {a.industry}</p>
              </div>
              {a.demo && <DemoBadge className="hidden sm:inline-flex" />}
              <span className="hidden text-xs text-faint sm:block">{timeAgo(a.createdAt)}</span>
              <StatusChip status={a.status} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
