/**
 * Formatting + display helpers shared across the app.
 */

import type {
  CapabilityLevel,
  ConfidenceLevel,
  CoverageStatus,
  EvidenceSupport,
  Importance,
  PartnerType,
} from "./api/types";
import { PARTNER_TYPE_LABELS } from "./api/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ─── Dates ─────────────────────────────────────────────────────────────────

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Scores ────────────────────────────────────────────────────────────────

export function scoreTone(score: number): "mint" | "signal" | "warn" | "danger" | "faint" {
  if (score >= 85) return "mint";
  if (score >= 70) return "signal";
  if (score >= 55) return "warn";
  if (score >= 40) return "danger";
  return "faint";
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Moderate";
  if (score >= 40) return "Weak";
  return "Poor";
}

// ─── Semantic colors ───────────────────────────────────────────────────────

export function importanceMeta(i: Importance): { label: string; className: string } {
  switch (i) {
    case "critical":
      return { label: "Critical", className: "text-warn border-warn/30 bg-warn/10" };
    case "high":
      return { label: "High", className: "text-brand-soft border-brand/30 bg-brand/10" };
    case "medium":
      return { label: "Medium", className: "text-signal border-signal/30 bg-signal/10" };
    default:
      return { label: "Low", className: "text-muted-foreground border-border bg-muted" };
  }
}

export function confidenceMeta(c: ConfidenceLevel): { label: string; className: string; dot: string } {
  switch (c) {
    case "high":
      return { label: "High confidence", className: "text-mint border-mint/30 bg-mint/10", dot: "bg-mint" };
    case "medium":
      return { label: "Medium confidence", className: "text-signal border-signal/30 bg-signal/10", dot: "bg-signal" };
    default:
      return { label: "Low confidence", className: "text-warn border-warn/30 bg-warn/10", dot: "bg-warn" };
  }
}

export function capabilityLevelMeta(l: CapabilityLevel): { label: string; className: string } {
  switch (l) {
    case "strong":
      return { label: "Strong", className: "text-mint border-mint/30 bg-mint/10" };
    case "moderate":
      return { label: "Moderate", className: "text-signal border-signal/30 bg-signal/10" };
    default:
      return { label: "Emerging", className: "text-warn border-warn/30 bg-warn/10" };
  }
}

export function coverageMeta(s: CoverageStatus): { label: string; className: string; dot: string } {
  switch (s) {
    case "supported":
      return { label: "Supported", className: "text-mint border-mint/30 bg-mint/10", dot: "bg-mint" };
    case "partial":
      return { label: "Partial", className: "text-signal border-signal/30 bg-signal/10", dot: "bg-signal" };
    default:
      return { label: "Not established", className: "text-faint border-border bg-muted/50", dot: "bg-faint" };
  }
}

export function supportMeta(s: EvidenceSupport): { label: string; className: string } {
  switch (s) {
    case "verified":
      return { label: "Verified", className: "text-mint border-mint/30 bg-mint/10" };
    case "unverified":
      return { label: "Unverified", className: "text-warn border-warn/30 bg-warn/10" };
    default:
      return { label: "Contradicted", className: "text-danger border-danger/30 bg-danger/10" };
  }
}

export function partnerTypeLabel(t: PartnerType): string {
  return PARTNER_TYPE_LABELS[t] ?? t;
}

// ─── Text ──────────────────────────────────────────────────────────────────

export function initials(name: string): string {
  return name
    .replace(/^(Dr\.|Mag\.|Prof\.)\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

/** Deterministic hue per partner id for monogram avatars. */
export function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
