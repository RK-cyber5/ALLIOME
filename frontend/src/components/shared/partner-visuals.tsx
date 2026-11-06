"use client";

import { ExternalLink, FileSearch, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import {
  confidenceMeta,
  domainFromUrl,
  formatDate,
  hueFromString,
  initials,
  supportMeta,
} from "@/lib/format";
import type {
  DecisionMaker,
  EvidenceSource,
  Partner,
} from "@/lib/api/types";

// ─── Monogram avatar (no fake logos) ───────────────────────────────────────

export function PartnerAvatar({
  partner,
  size = 40,
  className,
}: {
  partner: Pick<Partner, "id" | "name">;
  size?: number;
  className?: string;
}) {
  const hue = hueFromString(partner.id);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 select-none place-items-center rounded-lg border font-semibold",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        color: `hsl(${hue} 70% 78%)`,
        background: `linear-gradient(140deg, hsl(${hue} 45% 16%), hsl(${(hue + 40) % 360} 45% 12%))`,
        borderColor: `hsl(${hue} 40% 26%)`,
      }}
    >
      {initials(partner.name)}
    </span>
  );
}

// ─── Evidence ──────────────────────────────────────────────────────────────

const SupportIcon = ({ support }: { support: EvidenceSource["support"] }) => {
  const cls = "size-3.5 shrink-0";
  if (support === "verified") return <ShieldCheck className={cn(cls, "text-mint")} />;
  if (support === "provider_supported") return <ShieldCheck className={cn(cls, "text-signal")} />;
  if (support === "inferred" || support === "unverified") return <ShieldAlert className={cn(cls, "text-warn")} />;
  return <ShieldX className={cn(cls, "text-danger")} />;
};

/** Inline evidence chip that previews the source on hover. */
export function EvidenceChip({
  evidence,
  count,
  className,
}: {
  evidence: EvidenceSource[];
  count?: number;
  className?: string;
}) {
  const first = evidence[0];
  if (!first) return null;
  const total = count ?? evidence.length;
  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground",
            className,
          )}
        >
          <FileSearch className="size-3 text-brand-soft" />
          {total} source{total === 1 ? "" : "s"}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-80 border-border bg-popover/95 backdrop-blur">
        <div className="space-y-2.5">
          {evidence.slice(0, 4).map((e) => (
            <div key={e.id} className="flex items-start gap-2">
              <SupportIcon support={e.support} />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{e.title}</p>
                <p className="mt-0.5 text-[11px] text-faint">
                  {e.publisher} · {formatDate(e.retrieved_at)} ·{" "}
                  <span className={supportMeta(e.support).className.replace(/border[^ ]*|bg-[^ ]*/g, "").trim()}>
                    {supportMeta(e.support).label.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>
          ))}
          {evidence.length > 4 && (
            <p className="text-[11px] text-faint">+{evidence.length - 4} more in the profile</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/** Full evidence row for profiles & reports. */
export function EvidenceRow({ evidence, className }: { evidence: EvidenceSource; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-lg border bg-surface-2/60 p-3", className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5">
          <SupportIcon support={evidence.support} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium leading-snug text-foreground">{evidence.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-faint">
            {evidence.publisher} · Retrieved {formatDate(evidence.retrieved_at)}
            {evidence.note ? ` · ${evidence.note}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            supportMeta(evidence.support).className,
          )}
        >
          {supportMeta(evidence.support).label}
        </span>
        {evidence.url && <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-faint transition-colors hover:text-brand-soft"
          title={`Open source — ${domainFromUrl(evidence.url)}`}
        >
          <ExternalLink className="size-3.5" />
        </a>}
      </div>
    </div>
  );
}

// ─── Decision makers ───────────────────────────────────────────────────────

export function PersonCard({
  person,
  evidence = [],
  className,
}: {
  person: DecisionMaker;
  evidence?: EvidenceSource[];
  className?: string;
}) {
  const meta = confidenceMeta(person.confidence);
  const linkedEvidence = evidence.filter((e) => person.evidence_ids.includes(e.id));
  return (
    <div className={cn("rounded-xl border bg-surface-2/60 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-brand/25 bg-brand/10 text-xs font-semibold text-brand-soft">
            {initials(person.name)}
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground">{person.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{person.role}</p>
          </div>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium", meta.className)}>
          <span className={cn("size-1.5 rounded-full", meta.dot)} />
          {meta.label.replace(" confidence", "")}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{person.relevance}</p>
      {linkedEvidence.length > 0 && (
        <div className="mt-3">
          <EvidenceChip evidence={linkedEvidence} />
        </div>
      )}
    </div>
  );
}

// ─── Generic chips ─────────────────────────────────────────────────────────

export function Tag({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function LinkArrow({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-signal transition-colors hover:text-brand-soft",
        className,
      )}
    >
      {children}
      <ExternalLink className="size-3" />
    </a>
  );
}
