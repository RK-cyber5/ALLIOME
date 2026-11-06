"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DemoBadge } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";

/** Consistent animated page header used across workspace pages. */
export function PageHeader({
  title,
  description,
  actions,
  demo = false,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  demo?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {demo && <DemoBadge />}
        </div>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </motion.div>
  );
}
