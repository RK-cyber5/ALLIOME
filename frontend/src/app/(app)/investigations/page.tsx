"use client";

import Link from "next/link";
import { ArrowRight, PlusCircle, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { StatusChip } from "@/components/app/topbar";
import { DemoBadge, EmptyState } from "@/components/shared/primitives";
import { useWorkspace } from "@/lib/store";
import { formatDateTime } from "@/lib/format";

export default function InvestigationsPage() {
  const analyses = useWorkspace((s) => s.analyses);

  return (
    <>
      <PageHeader
        title="Investigations"
        description="Every market-entry investigation in this workspace, with its live backend status."
        actions={
          <Button size="sm" asChild>
            <Link href="/new">
              <PlusCircle className="size-3.5" /> New ecosystem
            </Link>
          </Button>
        }
      />

      {analyses.length === 0 ? (
        <EmptyState
          icon={<Radar className="size-5" />}
          title="No investigations yet"
          description="Submit a market-entry brief and ALLIOME will discover, investigate and score partner candidates for you."
          action={
            <Button asChild>
              <Link href="/new">
                <PlusCircle className="size-4" /> Start your first brief
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-surface-2/50">
          {analyses.map((a) => (
            <Link
              key={a.id}
              href={`/investigations/${a.id}`}
              className="group flex items-center gap-4 border-b border-border/60 px-4 py-4 transition-colors last:border-0 hover:bg-surface-3/40 sm:px-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border bg-surface-3 text-xs font-bold text-brand-soft">
                {(a.company || "?").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {a.company} — {a.product}
                  </p>
                  {a.demo && <DemoBadge />}
                </div>
                <p className="mt-0.5 truncate text-xs text-faint">
                  {a.geography || "—"} · {a.industry || "—"} · started {formatDateTime(a.createdAt)}
                </p>
              </div>
              <StatusChip status={a.status} />
              <ArrowRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-soft" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
