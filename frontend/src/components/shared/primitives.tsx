"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { AlertTriangle, Inbox, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { IS_DEMO } from "@/lib/api/client";

// ─── Demo data badge ───────────────────────────────────────────────────────

export function DemoBadge({ className, tooltip = "Synthetic demo record — not real research data." }: { className?: string; tooltip?: string }) {
  if (!IS_DEMO) return null;
  return (
    <span
      title={tooltip}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warn",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-warn" />
      Demo data
    </span>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.14em] text-faint", className)}>
      {children}
    </p>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "brand" | "signal" | "mint";
  className?: string;
}) {
  const toneRing =
    tone === "brand"
      ? "text-brand-soft bg-brand/10"
      : tone === "signal"
        ? "text-signal bg-signal/10"
        : tone === "mint"
          ? "text-mint bg-mint/10"
          : "text-muted-foreground bg-muted";
  return (
    <div className={cn("card-sheen rounded-xl border bg-surface-2 p-4 transition-colors hover:border-brand/30", className)}>
      <div className="flex items-start justify-between gap-2">
        <SectionLabel>{label}</SectionLabel>
        {icon && <span className={cn("grid size-7 place-items-center rounded-lg", toneRing)}>{icon}</span>}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</div>
      {hint && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Empty & error states ──────────────────────────────────────────────────

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-surface-1/50 px-6 py-14 text-center", className)}>
      <div className="grid size-12 place-items-center rounded-2xl border bg-surface-2 text-faint">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-danger/25 bg-danger/5 px-6 py-12 text-center", className)}>
      <div className="grid size-12 place-items-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
        <AlertTriangle className="size-5" />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-5">
          <RefreshCw className="size-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────

export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border bg-surface-2/60 p-3.5">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ cards = 4, className }: { cards?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border bg-surface-2/60 p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

// ─── Score animations ──────────────────────────────────────────────────────

export function AnimatedNumber({
  value,
  className,
  duration = 0.9,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toString());

  useEffect(() => {
    if (reduce) {
      count.jump(value);
      return;
    }
    const controls = animate(count, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [value, duration, reduce, count]);

  if (reduce) return <span className={cn("tabular-nums", className)}>{value}</span>;
  return <motion.span className={cn("tabular-nums", className)}>{rounded}</motion.span>;
}

export function SparklesHint({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-faint">
      <Sparkles className="size-3 text-brand-soft" />
      {children}
    </span>
  );
}
