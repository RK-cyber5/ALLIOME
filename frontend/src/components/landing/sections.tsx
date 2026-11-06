"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  Radar,
  FileSearch,
  Users,
  GitBranch,
  Puzzle,
  Layers,
  Radio,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Building2,
  Workflow as WorkflowIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/shared/primitives";

// ─── Shared bits ───────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0 : 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "")}>
      <SectionLabel className={cn(align === "center" && "justify-center", "flex items-center gap-2")}>
        <span className="inline-block size-1 rounded-full bg-brand" />
        {eyebrow}
      </SectionLabel>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}

const mini = "rounded-lg border border-border bg-surface-2/70";

// ─── How it works ──────────────────────────────────────────────────────────

const WORKFLOW = [
  {
    icon: ClipboardList,
    title: "Define the brief",
    text: "Company, market, capabilities, partner types — seven questions.",
  },
  {
    icon: Radar,
    title: "Discover candidates",
    text: "ALLIOME scans the market for companies matching your gaps.",
  },
  {
    icon: FileSearch,
    title: "Investigate & verify",
    text: "Capability claims checked against real evidence.",
  },
  {
    icon: Users,
    title: "Map decision-makers",
    text: "Relevant people and roles — with the proof.",
  },
  {
    icon: GitBranch,
    title: "Optimise the portfolio",
    text: "The complementary set, not the top N scores.",
  },
  {
    icon: Puzzle,
    title: "Activate & track",
    text: "Joint offers, outreach drafts, 30-day roadmap.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-20 border-t border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="From brief to activation plan"
            description="One investigation, nine stages — every claim traceable to evidence."
          />
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW.map((w, i) => (
            <Reveal key={w.title} delay={i * 0.06}>
              <div className="group relative h-full rounded-xl border bg-surface-2/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-surface-2">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg border border-brand/20 bg-brand/10 text-brand-soft transition-colors group-hover:border-brand/40">
                    <w.icon className="size-4" />
                  </span>
                  <span className="font-mono text-xs text-faint">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-foreground">{w.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{w.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Capabilities bento with mini mockups ─────────────────────────────────

function MiniDiscovery() {
  const rows = [
    { name: "RhineForge", cat: "Consultancy", fit: 92 },
    { name: "NordWerk", cat: "System integrator", fit: 89 },
    { name: "Baltic Digital", cat: "Technology", fit: 84 },
  ];
  return (
    <div className={cn(mini, "p-3")}>
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Candidates</span>
        <span className="text-[10px] text-faint">12 results</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-2.5 rounded-md bg-surface-3/60 px-2.5 py-2">
            <span className="grid size-6 place-items-center rounded bg-gradient-to-br from-brand/30 to-signal/20 text-[9px] font-bold text-foreground">
              {r.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-foreground">{r.name}</p>
              <p className="text-[9px] text-faint">{r.cat}</p>
            </div>
            <div className="w-14">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", r.fit >= 90 ? "bg-mint" : "bg-signal")} style={{ width: `${r.fit}%` }} />
              </div>
              <p className="mt-0.5 text-right font-mono text-[9px] text-muted-foreground">{r.fit}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniEvidence() {
  const rows = [
    { title: "Case study — Tier-1 automotive supplier", ok: true },
    { title: "“40+ manufacturing consultants”", ok: false },
    { title: "Careers — 6 open roles (Munich)", ok: true },
  ];
  return (
    <div className={cn(mini, "space-y-1.5 p-3")}>
      {rows.map((r) => (
        <div key={r.title} className="flex items-center gap-2 rounded-md bg-surface-3/60 px-2.5 py-2">
          {r.ok ? <ShieldCheck className="size-3.5 shrink-0 text-mint" /> : <ShieldAlert className="size-3.5 shrink-0 text-warn" />}
          <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">{r.title}</span>
          <span className={cn("rounded-full px-1.5 py-px text-[8.5px] font-semibold uppercase", r.ok ? "bg-mint/10 text-mint" : "bg-warn/10 text-warn")}>
            {r.ok ? "Verified" : "Unverified"}
          </span>
        </div>
      ))}
    </div>
  );
}

function MiniPeople() {
  const people = [
    { name: "L. Hoffmann", role: "Managing Partner" },
    { name: "M. Vogel", role: "Head of Mfg. Practice" },
    { name: "J. Brandt", role: "Principal, AI & Data" },
  ];
  return (
    <div className={cn(mini, "space-y-1.5 p-3")}>
      {people.map((p) => (
        <div key={p.name} className="flex items-center gap-2.5 rounded-md bg-surface-3/60 px-2.5 py-2">
          <span className="grid size-6 place-items-center rounded-full border border-brand/25 bg-brand/10 text-[8.5px] font-bold text-brand-soft">
            {p.name.split(" ").map((w) => w[0]).join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-foreground">{p.name}</p>
            <p className="truncate text-[9px] text-faint">{p.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniMatrix() {
  const caps = ["Domain", "Delivery", "MES/ERP", "Cloud", "Channel", "Relations"];
  const partners = ["RF", "NW", "AC", "HT"];
  const cells: number[][] = [
    [2, 1, 0, 1],
    [1, 2, 0, 0],
    [0, 2, 1, 0],
    [0, 1, 2, 0],
    [1, 1, 0, 2],
    [2, 1, 0, 1],
  ];
  const dot = (v: number) =>
    v === 2 ? "bg-mint" : v === 1 ? "bg-signal/70" : "bg-faint/30";
  return (
    <div className={cn(mini, "p-3")}>
      <table className="w-full border-separate border-spacing-y-1">
        <tbody>
          {cells.map((row, ri) => (
            <tr key={ri}>
              <td className="w-16 pr-2 text-right text-[9.5px] text-muted-foreground">{caps[ri]}</td>
              {row.map((v, ci) => (
                <td key={ci} className="px-1.5 text-center">
                  <span className={cn("inline-block size-2 rounded-full", dot(v))} title={`${partners[ci]} — ${["not established", "partial", "supported"][v]}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center justify-end gap-3 px-1 text-[8.5px] text-faint">
        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-mint" /> supported</span>
        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-signal/70" /> partial</span>
        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-faint/30" /> none</span>
      </div>
    </div>
  );
}

function MiniSolution() {
  return (
    <div className={cn(mini, "p-3")}>
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-brand-soft" />
        <p className="text-[11px] font-semibold text-foreground">Line Intelligence Program</p>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
        Joint 12-week offer: production diagnostics + AI scheduling on one line, delivered with a
        certified integrator.
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {["Joint value prop", "Pilot scope", "Success metrics", "Commercial model"].map((t) => (
          <span key={t} className="rounded border border-border bg-surface-3/70 px-1.5 py-0.5 text-[8.5px] text-muted-foreground">{t}</span>
        ))}
      </div>
    </div>
  );
}

function MiniRoadmap() {
  const weeks = [
    { w: "W1", items: 2 },
    { w: "W2", items: 2 },
    { w: "W3", items: 1 },
    { w: "W4", items: 1 },
  ];
  return (
    <div className={cn(mini, "p-3")}>
      <div className="grid grid-cols-4 gap-2">
        {weeks.map((w, i) => (
          <div key={w.w}>
            <p className="text-center font-mono text-[9px] text-faint">{w.w}</p>
            <div className={cn("mt-1 space-y-1 rounded-md border p-1.5", i === 0 ? "border-brand/35 bg-brand/10" : "border-border bg-surface-3/50")}>
              {Array.from({ length: w.items }).map((_, j) => (
                <div key={j} className="h-1.5 rounded-full bg-muted-foreground/25" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[8.5px] text-faint">30-day activation roadmap</p>
    </div>
  );
}

function MiniSignals() {
  const signals = [
    { text: "Published smart-factory case study", type: "content", ago: "3h" },
    { text: "6 new manufacturing-consultant roles", type: "hiring", ago: "9h" },
    { text: "Sovereign-AI hosting partnership", type: "partnership", ago: "1d" },
  ];
  return (
    <div className={cn(mini, "space-y-1.5 p-3")}>
      {signals.map((s) => (
        <div key={s.text} className="flex items-center gap-2 rounded-md bg-surface-3/60 px-2.5 py-2">
          <Radio className="size-3 shrink-0 text-signal" />
          <span className="min-w-0 flex-1 truncate text-[10.5px] text-foreground">{s.text}</span>
          <span className="font-mono text-[9px] text-faint">{s.ago}</span>
        </div>
      ))}
    </div>
  );
}

const CAPABILITIES = [
  {
    icon: Radar,
    title: "Partner discovery",
    text: "Integrators, consultancies, technology and channel partners matched to your brief.",
    visual: <MiniDiscovery />,
  },
  {
    icon: ShieldCheck,
    title: "Evidence-based intelligence",
    text: "Every claim checked against sources. Unverified stays visibly unverified.",
    visual: <MiniEvidence />,
  },
  {
    icon: Users,
    title: "Decision-maker mapping",
    text: "Know who to talk to — with the evidence behind each name.",
    visual: <MiniPeople />,
  },
  {
    icon: Layers,
    title: "Complementary portfolio selection",
    text: "Partners whose contributions interlock, covering every capability.",
    visual: <MiniMatrix />,
  },
  {
    icon: Puzzle,
    title: "Joint solution generation",
    text: "Value proposition, pilot scope, commercial model, success metrics.",
    visual: <MiniSolution />,
  },
  {
    icon: WorkflowIcon,
    title: "Partner activation",
    text: "Outreach drafts, meeting agendas and a 30-day roadmap — ready to execute.",
    visual: <MiniRoadmap />,
  },
  {
    icon: TrendingUp,
    title: "Continuous intelligence",
    text: "Hiring, content and alliance signals — monitored after the report.",
    visual: <MiniSignals />,
  },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="scroll-mt-20 border-t border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Product"
            title="An intelligence engine, not a company search"
            description="Seven capabilities — from “who exists” to “here's the plan.”"
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.title} delay={(i % 3) * 0.07} className={cn(i === 0 && "md:col-span-2 lg:col-span-1")}>
              <div className="group flex h-full flex-col rounded-xl border bg-surface-2/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-surface-2">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg border border-brand/20 bg-brand/10 text-brand-soft">
                    <c.icon className="size-4" />
                  </span>
                  <h3 className="text-[15px] font-semibold text-foreground">{c.title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
                <div className="mt-4 opacity-90 transition-opacity group-hover:opacity-100">{c.visual}</div>
              </div>
            </Reveal>
          ))}

          {/* Closing card */}
          <Reveal delay={0.14}>
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-brand/25 bg-gradient-to-br from-brand/15 via-surface-2 to-surface-1 p-5">
              <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand/20 blur-3xl" />
              <div>
                <span className="grid size-9 place-items-center rounded-lg border border-brand/30 bg-brand/15 text-brand-soft">
                  <Building2 className="size-4" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-foreground">Engineered your ecosystem yet?</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Answer seven questions — ALLIOME does the rest.
                </p>
              </div>
              <Button asChild className="mt-5 w-fit font-medium">
                <Link href="/new">
                  Start a brief <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Intelligence preview band ─────────────────────────────────────────────

export function IntelligencePreview() {
  return (
    <section id="intelligence" className="scroll-mt-20 border-t border-border/60 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <div>
            <SectionLabel className="flex items-center gap-2">
              <span className="inline-block size-1 rounded-full bg-signal" />
              Intelligence
            </SectionLabel>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Prove the fit — <span className="text-gradient">before</span> the first meeting
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
              ALLIOME shows the reasoning: which sources support each claim, what remains
              unverified, and what is simply missing.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Claims linked to evidence — sources, dates, status",
                "Unknowns stated explicitly, never silently skipped",
                "Portfolio rationale — why this set beats the top scores",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card-sheen rounded-2xl border bg-surface-2/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Capability coverage</p>
                <p className="text-xs text-faint">Aivera Flow · Germany &amp; DACH</p>
              </div>
              <span className="rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-xs font-semibold text-mint">6/6 covered</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                { name: "Manufacturing domain", by: "RhineForge", status: "supported" },
                { name: "Enterprise implementation", by: "NordWerk", status: "supported" },
                { name: "MES / ERP integration", by: "NordWerk", status: "supported" },
                { name: "EU cloud deployment", by: "AlpenCloud", status: "supported" },
                { name: "German distribution", by: "HanseTech", status: "supported" },
                { name: "Industry relationships", by: "RhineForge + HanseTech", status: "partial" },
              ].map((r) => (
                <div key={r.name} className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-3/50 px-3 py-2.5">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      r.status === "supported" ? "bg-mint" : "bg-signal",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{r.name}</span>
                  <span className="hidden truncate text-xs text-faint sm:block">{r.by}</span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      r.status === "supported" ? "border-mint/30 bg-mint/10 text-mint" : "border-signal/30 bg-signal/10 text-signal",
                    )}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[11px] text-faint">Illustrative preview of the portfolio workspace</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Final CTA ─────────────────────────────────────────────────────────────

export function FinalCta() {
  return (
    <section className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="card-sheen relative overflow-hidden rounded-2xl border bg-gradient-to-b from-surface-3 to-surface-1 px-6 py-14 text-center sm:px-14">
            <div className="pointer-events-none absolute inset-0 bg-grid-dots opacity-40 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_40%,black,transparent)]" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[540px] -translate-x-1/2 rounded-full bg-brand/20 blur-[110px]" />
            <div className="relative">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Engineer the right ecosystem
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
                Discover the right partners. Prove the fit. Activate new revenue channels.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" asChild className="h-11 px-7 font-medium">
                  <Link href="/new">
                    Engineer my ecosystem <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-11 px-7">
                  <Link href="/overview">Open the workspace</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row lg:px-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Logo size={26} />
          <p className="text-xs text-faint">AI-powered ecosystem intelligence &amp; partner activation.</p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="#capabilities" className="transition-colors hover:text-foreground">Product</a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#intelligence" className="transition-colors hover:text-foreground">Intelligence</a>
          <Link href="/overview" className="transition-colors hover:text-foreground">Workspace</Link>
        </nav>
        <p className="text-xs text-faint">© {new Date().getFullYear()} ALLIOME</p>
      </div>
    </footer>
  );
}
