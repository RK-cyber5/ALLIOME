"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronsUpDown,
  CircleCheck,
  CircleDashed,
  Loader2,
  Menu,
  Plus,
  Search,
  TriangleAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarNav } from "./sidebar-nav";
import { CommandPalette } from "./command-palette";
import { ShortcutsHelp } from "./shortcuts-help";
import { useWorkspace } from "@/lib/store";
import { IS_DEMO } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { AnalysisStatus } from "@/lib/api/types";

const STATUS_META: Record<AnalysisStatus, { label: string; className: string; icon: React.ReactNode }> = {
  queued: { label: "Queued", className: "text-faint border-border bg-muted/40", icon: <CircleDashed className="size-3" /> },
  running: { label: "Running", className: "text-signal border-signal/30 bg-signal/10", icon: <Loader2 className="size-3 animate-spin" /> },
  completed: { label: "Completed", className: "text-mint border-mint/30 bg-mint/10", icon: <CircleCheck className="size-3" /> },
  partial: { label: "Partial", className: "text-warn border-warn/30 bg-warn/10", icon: <TriangleAlert className="size-3" /> },
  failed: { label: "Failed", className: "text-danger border-danger/30 bg-danger/10", icon: <XCircle className="size-3" /> },
  cancelled: { label: "Cancelled", className: "text-faint border-border bg-muted/40", icon: <XCircle className="size-3" /> },
};

export function StatusChip({ status }: { status: AnalysisStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.queued;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium", meta.className)}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function AnalysisSwitcher() {
  const { analyses, activeAnalysisId, setActive } = useWorkspace();
  const active = analyses.find((a) => a.id === activeAnalysisId) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 max-w-[150px] justify-start gap-2 px-2.5 text-[13px] font-medium text-foreground hover:bg-muted/60 sm:max-w-[340px]"
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-md border border-brand/25 bg-brand/10">
            <Search className="size-3 text-brand-soft" />
          </span>
          <span className="min-w-0 flex-1 truncate text-left">{active ? active.title : "No active analysis"}</span>
          {active?.demo && (
            <span className="hidden shrink-0 rounded-full border border-warn/30 bg-warn/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-warn sm:inline">
              Demo
            </span>
          )}
          <ChevronsUpDown className="size-3.5 shrink-0 text-faint" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 border-border bg-popover/95 backdrop-blur">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          Investigations
        </DropdownMenuLabel>
        {analyses.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">No investigations yet.</p>
        )}
        {analyses.slice(0, 8).map((a) => (
          <DropdownMenuItem
            key={a.id}
            onClick={() => setActive(a.id)}
            className={cn("gap-2.5 py-2.5", a.id === activeAnalysisId && "bg-brand/10")}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md border bg-surface-2 text-[10px] font-bold text-brand-soft">
              {(a.company || "?").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">{a.company} — {a.product}</p>
              <p className="truncate text-[11px] text-faint">{a.geography || "—"} · {timeAgoShort(a.createdAt)}</p>
            </div>
            <StatusChip status={a.status} />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild className="gap-2 py-2.5">
          <Link href="/new">
            <Plus className="size-4 text-brand-soft" /> New ecosystem brief
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function timeAgoShort(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export function AppTopbar() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const resetAll = useWorkspace((s) => s.resetAll);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-4">
        {/* Mobile nav */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="size-5" />
        </Button>

        <AnalysisSwitcher />

        <div className="flex-1" />

        {/* Search trigger */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden h-9 items-center gap-2.5 rounded-lg border border-border bg-surface-1/70 px-3 text-[13px] text-faint transition-colors hover:border-brand/30 hover:text-muted-foreground sm:flex"
        >
          <Search className="size-3.5" />
          <span>Search partners, pages…</span>
          <kbd className="pointer-events-none ml-2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-faint">⌘K</kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Search"
          onClick={() => setPaletteOpen(true)}
        >
          <Search className="size-4.5" />
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu" className="rounded-full">
              <span className="grid size-8 place-items-center rounded-full border border-brand/30 bg-gradient-to-br from-brand/25 to-signal/15 text-xs font-semibold text-foreground">
                AM
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-popover/95 backdrop-blur">
            <DropdownMenuLabel>
              <p className="text-sm font-medium text-foreground">Alex Merk</p>
              <p className="text-xs font-normal text-faint">Workspace owner{IS_DEMO ? " · mock session" : ""}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={() => router.push("/settings")} className="gap-2">
              <UserRound className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-danger focus:text-danger"
              onClick={() => {
                resetAll();
                toast.success("Workspace reset", {
                  description: IS_DEMO
                    ? "Demo data cleared — the seeded demo analysis is back."
                    : "All locally stored investigations were removed.",
                });
                router.push("/overview");
              }}
            >
              <XCircle className="size-4" /> {IS_DEMO ? "Reset demo data" : "Clear workspace data"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-sidebar shadow-2xl">
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ShortcutsHelp />
    </>
  );
}
