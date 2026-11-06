"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  CircleAlert,
  Cpu,
  ExternalLink,
  FileSearch,
  Globe,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PartnerAvatar, EvidenceChip, EvidenceRow, PersonCard, Tag, LinkArrow } from "@/components/shared/partner-visuals";
import { SectionLabel } from "@/components/shared/primitives";
import { ConfidenceBadge, ScoreRing } from "@/components/shared/scores";
import { partnerTypeLabel } from "@/lib/format";
import type { Partner, PortfolioResult } from "@/lib/api/types";

function Block({
  icon,
  title,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-lg border border-border bg-surface-3 text-muted-foreground">
          {icon}
        </span>
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

const panel = "rounded-xl border bg-surface-2/50 p-5";

/**
 * Full partner intelligence profile — used by the discovery detail drawer
 * and the standalone partner page.
 */
export function PartnerProfileContent({
  partner,
  portfolio,
  analysisId,
}: {
  partner: Partner;
  portfolio?: PortfolioResult | null;
  analysisId?: string | null;
}) {
  const evIds = new Set(partner.evidence.map((e) => e.id));
  const ev = (ids: string[]) => partner.evidence.filter((e) => ids.includes(e.id) && evIds.has(e.id));
  const unverified = partner.evidence.filter((e) => e.support === "unverified");
  const inPortfolio = portfolio?.selected.some((s) => s.partner_id === partner.id);
  const selection = portfolio?.selected.find((s) => s.partner_id === partner.id);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-5 rounded-xl border bg-surface-2/50 p-5">
        <div className="flex min-w-0 items-start gap-4">
          <PartnerAvatar partner={partner} size={56} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{partner.name}</h2>
              {inPortfolio && (
                <Badge className="border-mint/30 bg-mint/10 text-mint hover:bg-mint/10">In portfolio</Badge>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
              <span className="inline-flex items-center gap-1"><Building2 className="size-3" /> {partnerTypeLabel(partner.category)}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {partner.hq}</span>
              {partner.employees && <span className="inline-flex items-center gap-1"><Users className="size-3" /> {partner.employees} employees</span>}
              <LinkArrow href={partner.website}>{partner.website.replace(/^https?:\/\/(www\.)?/, "")}</LinkArrow>
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {partner.geography.map((g) => (
                <Tag key={g}><Globe className="mr-1 size-3 text-faint" />{g}</Tag>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-center">
            <ScoreRing score={partner.strategic_fit} label="Fit" />
            <p className="mt-1.5 text-[10px] uppercase tracking-wide text-faint">Strategic fit</p>
          </div>
          <div className="text-center">
            <ScoreRing score={partner.activation_readiness} label="Ready" />
            <p className="mt-1.5 text-[10px] uppercase tracking-wide text-faint">Readiness</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <ConfidenceBadge level={partner.evidence_confidence} />
            <p className="max-w-[110px] text-center text-[10px] leading-tight text-faint">Evidence confidence</p>
          </div>
        </div>
      </div>

      {/* 1. Overview */}
      <Block icon={<Building2 className="size-3.5" />} title="Company overview">
        <p className="text-sm leading-relaxed text-muted-foreground">{partner.profile.overview}</p>
      </Block>

      {/* 2. Services & capabilities */}
      <Block icon={<Wrench className="size-3.5" />} title="Services & capabilities">
        <div className="flex flex-wrap gap-1.5">
          {partner.profile.services.map((s) => (
            <Tag key={s} className="text-[12px]">{s}</Tag>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {partner.capabilities.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-surface-2/40 px-3 py-2.5">
              <span className="min-w-0 truncate text-[13px] text-foreground">{c.name}</span>
              <span
                className={
                  c.level === "strong"
                    ? "shrink-0 rounded-full border border-mint/30 bg-mint/10 px-2 py-0.5 text-[10.5px] font-medium text-mint"
                    : c.level === "moderate"
                      ? "shrink-0 rounded-full border border-signal/30 bg-signal/10 px-2 py-0.5 text-[10.5px] font-medium text-signal"
                      : "shrink-0 rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-[10.5px] font-medium text-warn"
                }
              >
                {c.level}
              </span>
            </div>
          ))}
        </div>
      </Block>

      {/* 3. Industry expertise */}
      <Block icon={<Briefcase className="size-3.5" />} title="Industry expertise">
        <div className="space-y-2.5">
          {partner.profile.industry_expertise.map((ie) => (
            <div key={ie.industry} className="rounded-lg border border-border/70 bg-surface-2/40 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13.5px] font-medium text-foreground">{ie.industry}</p>
                <EvidenceChip evidence={ev(ie.evidence_ids)} />
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{ie.detail}</p>
            </div>
          ))}
          {partner.profile.industry_expertise.length === 0 && (
            <p className="text-sm text-faint">No industry expertise established by the investigation.</p>
          )}
        </div>
      </Block>

      {/* 4. Technology intelligence */}
      <Block icon={<Cpu className="size-3.5" />} title="Technology intelligence">
        <div className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {partner.profile.technology.stack.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-faint">Compatibility</span>
              <span className="font-mono text-lg font-bold text-brand-soft">{partner.technology_compatibility.score}</span>
            </div>
          </div>
          {partner.profile.technology.integrations.length > 0 && (
            <div className="mt-3.5 border-t border-border/60 pt-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">Integrations</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {partner.profile.technology.integrations.map((t) => (
                  <Tag key={t} className="border-signal/25 bg-signal/5 text-signal">{t}</Tag>
                ))}
              </div>
            </div>
          )}
          <p className="mt-3.5 border-t border-border/60 pt-3.5 text-[13px] leading-relaxed text-muted-foreground">
            {partner.profile.technology.notes}
          </p>
          <div className="mt-3">
            <EvidenceChip evidence={ev(partner.profile.technology.evidence_ids)} />
          </div>
        </div>
      </Block>

      {/* 5. Hiring & momentum */}
      <Block icon={<TrendingUp className="size-3.5" />} title="Hiring & business momentum">
        <p className="text-sm leading-relaxed text-muted-foreground">{partner.profile.hiring_momentum.summary}</p>
        <div className="mt-3 space-y-2">
          {partner.profile.hiring_momentum.signals.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-surface-2/40 px-3.5 py-2.5">
              <p className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">{s.signal}</p>
              <EvidenceChip evidence={ev(s.evidence_ids)} />
            </div>
          ))}
        </div>
      </Block>

      {/* 6. Relevant people */}
      <Block icon={<Users className="size-3.5" />} title={`Relevant people (${partner.decision_makers.length})`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {partner.decision_makers.map((p) => (
            <PersonCard key={p.id} person={p} evidence={partner.evidence} />
          ))}
        </div>
        {partner.decision_makers.length === 0 && (
          <p className="text-sm text-faint">No decision-makers could be identified for this company.</p>
        )}
      </Block>

      {/* 7. Evidence sources */}
      <Block icon={<FileSearch className="size-3.5" />} title={`Evidence sources (${partner.evidence.length})`}>
        <div className="space-y-2">
          {partner.evidence.map((e) => (
            <EvidenceRow key={e.id} evidence={e} />
          ))}
        </div>
      </Block>

      {/* 8. Unverified claims / unknowns */}
      <Block icon={<CircleAlert className="size-3.5" />} title="Unverified claims & unknowns">
        {unverified.length > 0 && (
          <div className="mb-3 space-y-2">
            {unverified.map((e) => (
              <EvidenceRow key={e.id} evidence={e} />
            ))}
          </div>
        )}
        <div className="rounded-xl border border-warn/25 bg-warn/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-warn">Important unknowns</p>
          <ul className="mt-2.5 space-y-2">
            {partner.unknowns.map((u, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warn/70" />
                {u}
              </li>
            ))}
          </ul>
          {partner.unknowns.length === 0 && <p className="mt-1 text-[13px] text-muted-foreground">No open unknowns recorded.</p>}
        </div>
      </Block>

      {/* 9. Strategic partnership rationale */}
      <Block icon={<Sparkles className="size-3.5" />} title="Strategic partnership rationale">
        <div className="rounded-xl border border-brand/25 bg-gradient-to-br from-brand/10 to-transparent p-5">
          <p className="text-sm leading-relaxed text-foreground">{partner.profile.partnership_rationale}</p>
          {selection && (
            <div className="mt-4 border-t border-brand/20 pt-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-soft">Portfolio contribution</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{selection.rationale}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {selection.contributions.map((c) => (
                  <span key={c.capability_key} className="rounded-md border border-brand/25 bg-brand/10 px-2 py-0.5 text-[11px] text-brand-soft">
                    {c.level === "strong" ? "Strong" : c.level === "moderate" ? "Moderate" : "Emerging"}: {c.capability_key.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Block>

      {analysisId && (
        <Link
          href={`/partners/${partner.id}?analysis=${analysisId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-signal transition-colors hover:text-brand-soft"
        >
          Open full profile page <ArrowUpRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

export { ExternalLink };
