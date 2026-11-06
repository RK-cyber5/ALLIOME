"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpDown,
  Building2,
  Check,
  Columns3,
  Download,
  Layers,
  Rows3,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/app/page-header";
import {
  DemoBadge,
  EmptyState,
  ErrorState,
  PageSkeleton,
  SectionLabel,
  SkeletonCards,
} from "@/components/shared/primitives";
import {
  ConfidenceBadge,
  ScoreBar,
} from "@/components/shared/scores";
import { PartnerAvatar, Tag } from "@/components/shared/partner-visuals";
import { PartnerProfileContent } from "@/components/partners/partner-profile";
import { useActiveAnalysisMeta, usePartners, usePortfolio } from "@/hooks/use-analysis";
import { PARTNER_TYPE_LABELS, type Partner } from "@/lib/api/types";
import { domainFromUrl, partnerTypeLabel, truncate } from "@/lib/format";
import { toCSV, downloadCSV } from "@/lib/csv";
import { useUrlState } from "@/hooks/use-url-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "strategic_fit" | "activation_readiness" | "name" | "evidence_confidence";
const CONFIDENCE_ORDER = { high: 3, medium: 2, low: 1 } as const;

export default function DiscoveryPage() {
  const { entry, hasActive } = useActiveAnalysisMeta();
  const hasResults = hasActive && (entry!.status === "completed" || entry!.status === "partial");
  const partners = usePartners(hasResults ? entry!.id : null);
  const portfolio = usePortfolio(hasResults ? entry!.id : null);

  // Filter/sort state is persisted in the URL so views are shareable.
  const [view, setView] = useUrlState("view", "table");
  const [search, setSearch] = useUrlState("q", "");
  const [category, setCategory] = useUrlState("category", "all");
  const [confidence, setConfidence] = useUrlState("confidence", "all");
  const [sortKey, setSortKey] = useUrlState("sort", "strategic_fit");
  const [sortDir, setSortDir] = useUrlState("dir", "desc");
  const viewTyped = (view === "cards" ? "cards" : "table") as "table" | "cards";
  const sortKeyTyped = (["strategic_fit", "activation_readiness", "name", "evidence_confidence"].includes(sortKey) ? sortKey : "strategic_fit") as SortKey;
  const sortDirTyped = (sortDir === "asc" ? "asc" : "desc") as "asc" | "desc";
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerPartner, setDrawerPartner] = useState<Partner | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const reduce = useReducedMotion();

  const data = partners.data;
  const portfolioIds = useMemo(
    () => new Set(portfolio.data?.selected.map((s) => s.partner_id) ?? []),
    [portfolio.data],
  );

  const categories = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.partners.map((p) => p.category)));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = [...data.partners];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.capabilities.some((c) => c.name.toLowerCase().includes(q)) ||
          p.hq.toLowerCase().includes(q),
      );
    }
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (confidence !== "all") list = list.filter((p) => p.evidence_confidence === confidence);
    list.sort((a, b) => {
      const dir = sortDirTyped === "desc" ? -1 : 1;
      switch (sortKeyTyped) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "activation_readiness":
          return (a.activation_readiness - b.activation_readiness) * dir;
        case "evidence_confidence":
          return (CONFIDENCE_ORDER[a.evidence_confidence] - CONFIDENCE_ORDER[b.evidence_confidence]) * dir;
        default:
          return (a.strategic_fit - b.strategic_fit) * dir;
      }
    });
    return list;
  }, [data, search, category, confidence, sortKeyTyped, sortDirTyped]);

  const exportCSV = () => {
    if (!filtered.length) return;
    const rows = filtered.map((p) => ({
      name: p.name,
      website: p.website,
      hq: p.hq,
      category: partnerTypeLabel(p.category),
      strategic_fit: p.strategic_fit,
      activation_readiness: p.activation_readiness,
      evidence_confidence: p.evidence_confidence,
      capabilities: p.capabilities.map((c) => `${c.name} (${c.level})`).join("; "),
      geography: p.geography.join("; "),
      tech_compatibility: p.technology_compatibility.score,
      decision_makers: p.decision_makers.length,
      unknowns: p.unknowns.length,
    }));
    const csv = toCSV(rows, [
      { key: "name", header: "Company" },
      { key: "website", header: "Website" },
      { key: "hq", header: "HQ" },
      { key: "category", header: "Category" },
      { key: "strategic_fit", header: "Strategic fit (0-100)" },
      { key: "activation_readiness", header: "Activation readiness (0-100)" },
      { key: "evidence_confidence", header: "Evidence confidence" },
      { key: "capabilities", header: "Capabilities" },
      { key: "geography", header: "Geography" },
      { key: "tech_compatibility", header: "Tech compatibility (0-100)" },
      { key: "decision_makers", header: "Decision-makers" },
      { key: "unknowns", header: "Open unknowns" },
    ]);
    const slug = (entry?.company || "partners").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCSV(csv, `alliome-${slug}-partners`);
    toast.success("CSV exported", { description: `${filtered.length} partner${filtered.length === 1 ? "" : "s"} exported with current filters.` });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKeyTyped === key) setSortDir(sortDirTyped === "desc" ? "asc" : "desc");
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= 3) return [...s.slice(1), id];
      return [...s, id];
    });
  };

  const selectedPartners = useMemo(
    () => (data ? selected.map((id) => data.partners.find((p) => p.id === id)).filter(Boolean) as Partner[] : []),
    [data, selected],
  );

  if (!hasActive) {
    return (
      <>
        <PageHeader title="Partner discovery" />
        <EmptyState
          icon={<Search className="size-5" />}
          title="No active investigation"
          description="Partner intelligence appears here once an investigation completes."
          action={
            <Button asChild>
              <Link href="/new">Start a brief</Link>
            </Button>
          }
        />
      </>
    );
  }

  if (!hasResults) {
    return (
      <>
        <PageHeader title="Partner discovery" description={`${entry!.company} — ${entry!.product}`} demo={entry!.demo} />
        <EmptyState
          icon={<Search className="size-5" />}
          title={`Results arrive when the investigation finishes (currently ${entry!.status})`}
          description="ALLIOME never shows invented placeholder results — the table fills with backend data once the run reaches a terminal state."
          action={
            <Button variant="outline" asChild>
              <Link href={`/investigations/${entry!.id}`}>Track investigation</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Partner discovery"
        description={
          <>
            {entry!.company} — {entry!.product} · {entry!.geography} &nbsp;
            <span className="text-faint">
              {data?.partners.length ?? 0} investigated candidates
            </span>
          </>
        }
        demo={entry!.demo}
        actions={
          <div className="flex items-center rounded-lg border border-border bg-surface-1/70 p-0.5">
            <button
              type="button"
              onClick={() => setView("table")}
              aria-pressed={viewTyped === "table"}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                viewTyped === "table" ? "bg-brand/15 text-foreground" : "text-faint hover:text-foreground",
              )}
            >
              <Rows3 className="size-3.5" /> Table
            </button>
            <button
              type="button"
              onClick={() => setView("cards")}
              aria-pressed={viewTyped === "cards"}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                viewTyped === "cards" ? "bg-brand/15 text-foreground" : "text-faint hover:text-foreground",
              )}
            >
              <Columns3 className="size-3.5" /> Cards
            </button>
          </div>
        }
      />

      {data?.partial && (
        <div className="mb-5 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <DemoBadge />
            <p className="text-sm font-medium text-foreground">Partial results</p>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {data.partial.reason} Missing: {data.partial.missing.join(", ")}.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <Input
            className="h-9 border-border bg-surface-1/70 pl-9 text-[13px]"
            placeholder="Search name, capability, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 w-[160px] border-border bg-surface-1/70 text-[13px]" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="all" className="text-[13px]">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="text-[13px]">{partnerTypeLabel(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={confidence} onValueChange={setConfidence}>
          <SelectTrigger className="h-9 w-[170px] border-border bg-surface-1/70 text-[13px]" aria-label="Filter by evidence confidence">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="all" className="text-[13px]">Any confidence</SelectItem>
            <SelectItem value="high" className="text-[13px]">High confidence</SelectItem>
            <SelectItem value="medium" className="text-[13px]">Medium confidence</SelectItem>
            <SelectItem value="low" className="text-[13px]">Low confidence</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs text-faint sm:flex">
            <SlidersHorizontal className="size-3.5" />
            {filtered.length} of {data?.partners.length ?? 0}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={filtered.length === 0}
            onClick={exportCSV}
            title="Export the filtered partner list as a CSV file"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={selected.length < 2}
            onClick={() => setCompareOpen(true)}
          >
            <Columns3 className="size-3.5" />
            Compare {selected.length > 0 && `(${selected.length})`}
          </Button>
        </div>
      </div>

      {partners.loading && <SkeletonCards cards={6} />}
      {partners.error && !partners.loading && <ErrorState description={partners.error} onRetry={partners.refetch} />}

      {data && !partners.loading && filtered.length === 0 && (
        <EmptyState
          title="No partners match these filters"
          description="Try clearing the search or widening the category and confidence filters."
          action={
            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setCategory("all"); setConfidence("all"); }}>
              Clear filters
            </Button>
          }
        />
      )}

      {/* TABLE VIEW */}
      {data && !partners.loading && viewTyped === "table" && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-surface-2/50">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-[11px] uppercase tracking-wider text-faint">
                <th className="w-10 px-3 py-3" />
                <th className="px-3 py-3">
                  <button type="button" className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                    Company <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="px-3 py-3">Category</th>
                <th className="w-36 px-3 py-3">
                  <button type="button" className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("strategic_fit")}>
                    Strategic fit <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="w-36 px-3 py-3">
                  <button type="button" className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("activation_readiness")}>
                    Readiness <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("evidence_confidence")}>
                    Evidence <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="px-3 py-3">Capabilities</th>
                <th className="px-3 py-3">Region</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="group cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-surface-3/40"
                  onClick={() => setDrawerPartner(p)}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={selected.includes(p.id)}
                      aria-label={`Select ${p.name} for comparison`}
                      onClick={() => toggleSelected(p.id)}
                      className={cn(
                        "grid size-4.5 place-items-center rounded border transition-colors",
                        selected.includes(p.id) ? "border-brand bg-brand text-white" : "border-faint/40 hover:border-brand/50",
                      )}
                    >
                      {selected.includes(p.id) && <Check className="size-3" />}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <PartnerAvatar partner={p} size={34} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-foreground">{p.name}</p>
                          {portfolioIds.has(p.id) && (
                            <span className="shrink-0 rounded-full border border-mint/30 bg-mint/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-mint">Portfolio</span>
                          )}
                        </div>
                        <p className="truncate text-xs text-faint">{domainFromUrl(p.website)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-muted-foreground">{partnerTypeLabel(p.category)}</td>
                  <td className="px-3 py-3"><ScoreBar score={p.strategic_fit} /></td>
                  <td className="px-3 py-3"><ScoreBar score={p.activation_readiness} /></td>
                  <td className="px-3 py-3"><ConfidenceBadge level={p.evidence_confidence} /></td>
                  <td className="px-3 py-3">
                    <div className="flex max-w-[240px] flex-wrap gap-1">
                      <Tag key={p.capabilities[0].key} className="max-w-[170px] truncate" title={p.capabilities.map((c) => c.name).join(" · ")}>
                        {p.capabilities[0].name}
                      </Tag>
                      {p.capabilities.length > 1 && <Tag title={p.capabilities.slice(1).map((c) => c.name).join(" · ")}>+{p.capabilities.length - 1} more</Tag>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-muted-foreground">{p.geography[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CARD VIEW */}
      {data && !partners.loading && viewTyped === "cards" && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <motion.button
                key={p.id}
                type="button"
                layout={!reduce}
                initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : Math.min(i * 0.03, 0.3) }}
                onClick={() => setDrawerPartner(p)}
                className={cn(
                  "group flex flex-col rounded-xl border bg-surface-2/50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand/30",
                  selected.includes(p.id) && "border-brand/45 bg-brand/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <PartnerAvatar partner={p} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-foreground">{p.name}</p>
                      <p className="truncate text-xs text-faint">{partnerTypeLabel(p.category)} · {p.hq}</p>
                    </div>
                  </div>
                  <span
                    role="checkbox"
                    aria-checked={selected.includes(p.id)}
                    aria-label={`Select ${p.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelected(p.id);
                    }}
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded border transition-colors",
                      selected.includes(p.id) ? "border-brand bg-brand text-white" : "border-faint/40 group-hover:border-brand/50",
                    )}
                  >
                    {selected.includes(p.id) && <Check className="size-3" />}
                  </span>
                </div>
                <div className="mt-4 space-y-2.5">
                  <ScoreBar score={p.strategic_fit} label="Strategic fit" />
                  <ScoreBar score={p.activation_readiness} label="Readiness" />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <ConfidenceBadge level={p.evidence_confidence} />
                  {portfolioIds.has(p.id) && (
                    <Badge variant="outline" className="border-mint/30 bg-mint/10 text-mint">Portfolio</Badge>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.capabilities.slice(0, 3).map((c) => (
                    <Tag key={c.key} className="max-w-[130px] truncate">{c.name}</Tag>
                  ))}
                </div>
                <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-faint">
                  {truncate(p.profile.partnership_rationale, 120)}
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Selection bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-brand/30 bg-surface-3/95 px-4 py-3 shadow-2xl backdrop-blur"
          >
            <Users className="size-4 shrink-0 text-brand-soft" />
            <p className="flex-1 text-[13px] text-foreground">
              {selected.length} selected <span className="text-faint">· up to 3 for comparison</span>
            </p>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])} aria-label="Clear selection">
              <X className="size-4" />
            </Button>
            <Button size="sm" disabled={selected.length < 2} onClick={() => setCompareOpen(true)}>
              Compare
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail drawer */}
      <Sheet open={!!drawerPartner} onOpenChange={(o) => !o && setDrawerPartner(null)}>
        <SheetContent className="scrollbar-thin w-full overflow-y-auto border-border bg-background/98 sm:max-w-2xl">
          <SheetHeader className="pb-0">
            <SheetTitle className="flex items-center gap-2.5 text-base">
              <Building2 className="size-4 text-brand-soft" /> Partner intelligence
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8">
            {drawerPartner && (
              <PartnerProfileContent partner={drawerPartner} portfolio={portfolio.data} analysisId={entry!.id} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Compare dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="scrollbar-thin max-h-[85vh] max-w-4xl overflow-y-auto border-border bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <Columns3 className="size-4.5 text-brand-soft" /> Compare partners
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-faint">
                  <th className="w-32 py-2.5 pr-3" />
                  {selectedPartners.map((p) => (
                    <th key={p.id} className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <PartnerAvatar partner={p} size={30} />
                        <span className="font-semibold text-foreground">{p.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  ["Category", (p: Partner) => partnerTypeLabel(p.category)],
                  ["HQ", (p: Partner) => p.hq],
                  ["Employees", (p: Partner) => p.employees ?? "—"],
                  ["Strategic fit", (p: Partner) => String(p.strategic_fit)],
                  ["Activation readiness", (p: Partner) => String(p.activation_readiness)],
                  ["Evidence confidence", (p: Partner) => p.evidence_confidence],
                  ["Capabilities", (p: Partner) => p.capabilities.map((c) => c.name).join(", ")],
                  ["Geography", (p: Partner) => p.geography.join(", ")],
                  ["Tech compatibility", (p: Partner) => String(p.technology_compatibility.score)],
                  ["Decision-makers", (p: Partner) => String(p.decision_makers.length)],
                  ["Open unknowns", (p: Partner) => String(p.unknowns.length)],
                  ["In portfolio", (p: Partner) => (portfolioIds.has(p.id) ? "Yes" : "No")],
                ] as const).map(([label, get]) => (
                  <tr key={label} className="border-b border-border/50 align-top last:border-0">
                    <td className="py-2.5 pr-3 text-faint">{label}</td>
                    {selectedPartners.map((p) => (
                      <td key={p.id} className="py-2.5 pr-3 leading-relaxed text-muted-foreground">{get(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setCompareOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
