"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCircle2,
  Database,
  Info,
  Loader2,
  Plug,
  RefreshCw,
  RotateCcw,
  Server,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { SectionLabel, DemoBadge } from "@/components/shared/primitives";
import { useWorkspace } from "@/lib/store";
import { API_BASE_URL, API_MODE, IS_DEMO, checkHealth, type HealthStatus } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { simulate, setSimulate, resetAll, analyses } = useWorkspace();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const runCheck = async () => {
    setChecking(true);
    const h = await checkHealth();
    setHealth(h);
    setChecking(false);
    if (h.ok) toast.success("Backend reachable");
    else toast.error("Backend unreachable", { description: h.detail });
  };

  useEffect(() => {
    let cancelled = false;
    checkHealth().then((h) => {
      if (!cancelled) setHealth(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Backend connection and workspace data. Configuration comes from environment variables."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* API connection */}
        <section className="card-sheen rounded-xl border bg-surface-2/50 p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-signal/25 bg-signal/10 text-signal">
              <Plug className="size-4" />
            </span>
            <h2 className="text-[15px] font-semibold text-foreground">Backend connection</h2>
          </div>

          <dl className="mt-5 space-y-3.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Mode</dt>
              <dd className="flex items-center gap-2">
                {IS_DEMO ? <DemoBadge /> : <span className="rounded-full border border-mint/30 bg-mint/10 px-2 py-0.5 text-[11px] font-semibold text-mint">Live API</span>}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Base URL</dt>
              <dd className="truncate font-mono text-xs text-foreground">{API_BASE_URL || "— (not set)"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Health</dt>
              <dd className="flex items-center gap-2">
                {checking ? (
                  <span className="flex items-center gap-1.5 text-xs text-faint"><Loader2 className="size-3.5 animate-spin" /> checking…</span>
                ) : health?.ok ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-mint"><CheckCircle2 className="size-3.5" /> reachable</span>
                ) : health ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-danger"><TriangleAlert className="size-3.5" /> unreachable</span>
                ) : (
                  <span className="text-xs text-faint">unknown</span>
                )}
                <Button size="sm" variant="ghost" onClick={runCheck} aria-label="Re-check backend health">
                  <RefreshCw className={cn("size-3.5", checking && "animate-spin")} />
                </Button>
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-lg border border-border/70 bg-surface-1/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">Backend configuration</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {API_MODE === "live" ? (
                <>
                  This build calls the FastAPI backend directly. To point at a different server (or switch to the
                  clearly-labelled mock mode for local development and tests), set the environment variables and restart:
                </>
              ) : (
                <>
                  This build runs against the built-in mock engine. To connect the real FastAPI backend, set the
                  environment variables and restart — no code changes:
                </>
              )}
            </p>
            <pre className="mt-2.5 overflow-x-auto rounded-md border border-border bg-background/80 p-3 font-mono text-[11.5px] leading-relaxed text-signal">
{`NEXT_PUBLIC_API_BASE_URL=${API_MODE === "live" ? API_BASE_URL : "http://localhost:8000"}
NEXT_PUBLIC_API_MODE=${API_MODE === "live" ? "mock  # demo data for dev/tests" : "live"}`}
            </pre>
            <p className="mt-2.5 text-xs leading-relaxed text-faint">
              Endpoints used: <span className="font-mono">GET /health</span>,{" "}
              <span className="font-mono">POST /api/analyze</span>,{" "}
              <span className="font-mono">GET /api/analyze/&#123;id&#125;</span>,{" "}
              <span className="font-mono">/partners</span>, <span className="font-mono">/portfolio</span>,{" "}
              <span className="font-mono">/activation</span>.
            </p>
          </div>
        </section>

        {/* Demo controls (mock mode only — local development & automated testing) */}
        {IS_DEMO && (
        <section className="card-sheen rounded-xl border bg-surface-2/50 p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-warn/25 bg-warn/10 text-warn">
              <Zap className="size-4" />
            </span>
            <h2 className="text-[15px] font-semibold text-foreground">Mock engine controls</h2>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            The mock engine simulates the backend workflow locally and returns fictional records (clearly labelled
            throughout the UI). These switches only affect the <span className="font-medium text-foreground">next
            run</span> you start from{" "}
            <Link href="/new" className="text-signal hover:text-brand-soft">New ecosystem</Link>. Use it for local
            development and automated tests — the live backend serves real Crustdata research.
          </p>

          <div className="mt-5 space-y-2.5">
            {(
              [
                { key: "none", label: "Normal run", desc: "All stages complete (~50 seconds)" },
                { key: "partial", label: "Simulate partial results", desc: "Finishes with degraded evidence — some partners lose decision-maker data" },
                { key: "fail", label: "Simulate backend failure", desc: "Fails during capability investigation with a recoverable error" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSimulate(opt.key)}
                aria-pressed={simulate === opt.key}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-all",
                  simulate === opt.key ? "border-brand/45 bg-brand/10" : "border-border bg-surface-1/60 hover:border-brand/25",
                )}
              >
                <span className={cn("mt-0.5 grid size-4 place-items-center rounded-full border", simulate === opt.key ? "border-brand bg-brand" : "border-faint/40")}>
                  {simulate === opt.key && <span className="size-1.5 rounded-full bg-white" />}
                </span>
                <span>
                  <span className="block text-[13.5px] font-medium text-foreground">{opt.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{opt.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
        )}

        {/* Workspace data */}
        <section className="card-sheen rounded-xl border bg-surface-2/50 p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-brand/25 bg-brand/10 text-brand-soft">
              <Database className="size-4" />
            </span>
            <h2 className="text-[15px] font-semibold text-foreground">Workspace data</h2>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            The investigation index and activation-task progress are stored in this browser (localStorage) because the
            current API contract has no list-analyses endpoint. Nothing is fabricated here — only investigations you
            started in this browser are listed.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border/70 bg-surface-1/60 px-4 py-3">
            <span className="text-sm text-muted-foreground">Stored investigations</span>
            <span className="font-mono text-lg font-bold text-foreground">{analyses.length}</span>
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              resetAll();
              toast.success(
                IS_DEMO ? "Workspace data cleared" : "Workspace cleared",
                { description: IS_DEMO ? "The seeded demo analysis has been restored." : "All locally stored investigations were removed." },
              );
            }}
          >
            <RotateCcw className="size-4" /> {IS_DEMO ? "Clear data & restore demo" : "Clear workspace data"}
          </Button>
        </section>

        {/* About */}
        <section className="card-sheen rounded-xl border bg-surface-2/50 p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-border bg-surface-3 text-muted-foreground">
              <Info className="size-4" />
            </span>
            <h2 className="text-[15px] font-semibold text-foreground">About this build</h2>
          </div>
          <dl className="mt-4 space-y-2.5 text-[13px]">
            {[
              ["Product", "ALLIOME — AI Ecosystem Architect"],
              ["Frontend", "Next.js 16 (App Router) · React 19 · TypeScript"],
              ["Design system", "Tailwind CSS 4 · shadcn/ui · Geist · Motion"],
              ["API layer", `Centralized adapter — currently ${API_MODE === "live" ? `live (${API_BASE_URL})` : "mock (fictional demo data)"}`],
              ["Data integrity", "Every partner, score and evidence record comes from backend processing; mock data exists only in explicit mock mode"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="w-28 shrink-0 text-faint">{k}</dt>
                <dd className="min-w-0 text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border/70 bg-surface-1/60 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-faint">
            <Server className="size-3.5 shrink-0" />
            The partner-intelligence backend is a separate FastAPI service owned by the backend team.
          </div>
        </section>
      </div>

      <SectionLabel className="mt-8">Keyboard shortcuts</SectionLabel>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["⌘K / Ctrl+K", "Open the command palette"],
          ["?", "Show the full shortcuts reference"],
          ["G then O/N/D/P/A/R", "Jump to a workspace page"],
          ["T / C", "Switch discovery table/card view"],
          ["/", "Focus the discovery search field"],
          ["Esc", "Close dialogs and drawers"],
        ].map(([keys, desc]) => (
          <div key={keys} className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-2/50 px-3.5 py-2.5">
            <kbd className="shrink-0 rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{keys}</kbd>
            <span className="text-xs text-muted-foreground">{desc}</span>
          </div>
        ))}
      </div>
    </>
  );
}
