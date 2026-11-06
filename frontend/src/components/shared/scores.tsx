"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  capabilityLevelMeta,
  confidenceMeta,
  coverageMeta,
  importanceMeta,
  scoreLabel,
  scoreTone,
} from "@/lib/format";
import { AnimatedNumber } from "./primitives";
import type {
  CapabilityLevel,
  ConfidenceLevel,
  CoverageStatus,
  Importance,
} from "@/lib/api/types";

const toneColor: Record<string, string> = {
  mint: "#2F855A",
  signal: "#A87F2E",
  warn: "#C2703D",
  danger: "#B0493F",
  faint: "#8B948D",
};

/** Horizontal animated score bar with label. */
export function ScoreBar({
  score,
  label,
  className,
  showValue = true,
  size = "md",
}: {
  score: number;
  label?: string;
  className?: string;
  showValue?: boolean;
  size?: "sm" | "md";
}) {
  const reduce = useReducedMotion();
  const tone = toneColor[scoreTone(score)];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <div className={cn("relative flex-1 overflow-hidden rounded-full bg-muted", size === "sm" ? "h-1" : "h-1.5")}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${tone}66, ${tone})` }}
          initial={{ width: reduce ? `${score}%` : 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
        />
      </div>
      {showValue && (
        <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: tone }}>
          {score}
        </span>
      )}
    </div>
  );
}

/** Circular score ring for cards / detail views. */
export function ScoreRing({
  score,
  size = 56,
  strokeWidth = 4,
  label,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const tone = toneColor[scoreTone(score)];
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(44,52,49,0.12)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c - (c * score) / 100 : c }}
          animate={{ strokeDashoffset: c - (c * score) / 100 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${tone}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={score} className="font-mono text-sm font-bold" />
        {label && <span className="text-[9px] uppercase tracking-wide text-faint">{label}</span>}
      </div>
    </div>
  );
}

export function ConfidenceBadge({ level, className }: { level: ConfidenceLevel; className?: string }) {
  const meta = confidenceMeta(level);
  return (
    <span
      title={`Evidence confidence: ${meta.label.toLowerCase()}`}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium", meta.className, className)}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label.replace(" confidence", "")}
    </span>
  );
}

export function CapabilityLevelBadge({ level, className }: { level: CapabilityLevel; className?: string }) {
  const meta = capabilityLevelMeta(level);
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", meta.className, className)}>
      {meta.label}
    </span>
  );
}

export function ImportanceBadge({ importance, className }: { importance: Importance; className?: string }) {
  const meta = importanceMeta(importance);
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", meta.className, className)}>
      {meta.label}
    </span>
  );
}

/** Coverage matrix cell: supported / partial / not established. */
export function CoveragePill({ status, note, compact }: { status: CoverageStatus; note?: string; compact?: boolean }) {
  const meta = coverageMeta(status);
  if (compact) {
    return (
      <span
        title={note ? `${meta.label} — ${note}` : meta.label}
        className={cn("mx-auto block size-2.5 rounded-full", meta.dot)}
        aria-label={meta.label}
      />
    );
  }
  return (
    <span
      title={note ?? meta.label}
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium", meta.className)}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

/** Small labelled score column used in tables. */
export function ScoreCell({ score, label }: { score: number; label?: string }) {
  const tone = toneColor[scoreTone(score)];
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[13px] font-semibold tabular-nums" style={{ color: tone }}>
        {score}
        <span className="text-[10px] font-normal text-faint"> /100</span>
      </span>
      <span className="text-[11px] text-faint">{label ?? scoreLabel(score)}</span>
    </div>
  );
}
