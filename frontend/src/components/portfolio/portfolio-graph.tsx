"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Partner, PortfolioResult } from "@/lib/api/types";

/**
 * Interactive capability-portfolio graph (SVG).
 * Left column: required capabilities. Right column: selected partners.
 * Edges: contribution level. Selecting a partner highlights its connections.
 * Pure SVG — no 3D engine needed, fully responsive, reduced-motion aware.
 */

const LEVEL_COLOR = {
  strong: "#2F855A",
  moderate: "#A87F2E",
  emerging: "#C2703D",
} as const;

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "capability" | "partner";
  partnerId?: string;
}

export function PortfolioGraph({
  portfolio,
  partners,
  onOpenPartner,
  className,
}: {
  portfolio: PortfolioResult;
  partners: Partner[];
  onOpenPartner?: (p: Partner) => void;
  className?: string;
}) {
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const W = 800;
  const H = Math.max(380, Math.max(portfolio.capabilities.length, portfolio.selected.length) * 72 + 130);

  const capNodes: GraphNode[] = useMemo(
    () =>
      portfolio.capabilities.map((c, i) => ({
        id: `cap:${c.key}`,
        label: c.name,
        x: 172,
        y: 70 + (i * (H - 130)) / Math.max(1, portfolio.capabilities.length - 1 || 1),
        kind: "capability" as const,
      })),
    [portfolio.capabilities, H],
  );

  const partnerNodes: GraphNode[] = useMemo(
    () =>
      portfolio.selected.map((s, i) => {
        const p = partners.find((x) => x.id === s.partner_id);
        return {
          id: `pt:${s.partner_id}`,
          label: p?.name ?? s.partner_id,
          x: 590,
          y: 70 + (i * (H - 130)) / Math.max(1, portfolio.selected.length - 1 || 1),
          kind: "partner" as const,
          partnerId: s.partner_id,
        };
      }),
    [portfolio.selected, partners, H],
  );

  const edges = useMemo(() => {
    const list: {
      from: GraphNode;
      to: GraphNode;
      level: "strong" | "moderate" | "emerging";
      partnerId: string;
      capId: string;
    }[] = [];
    for (const s of portfolio.selected) {
      for (const contrib of s.contributions) {
        const from = capNodes.find((c) => c.id === `cap:${contrib.capability_key}`);
        const to = partnerNodes.find((p) => p.id === `pt:${s.partner_id}`);
        if (from && to) {
          list.push({ from, to, level: contrib.level, partnerId: s.partner_id, capId: contrib.capability_key });
        }
      }
    }
    return list;
  }, [portfolio.selected, capNodes, partnerNodes]);

  const focus = selectedPartner ?? hovered;

  /** Two balanced lines for partner names (keeps the right margin safe). */
  const balancedSplit = (label: string): string[] => {
    if (label.length <= 18) return [label];
    const words = label.split(" ");
    let best: { diff: number; a: string; b: string } | null = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      const diff = Math.abs(a.length - b.length);
      if (!best || diff < best.diff) best = { diff, a, b };
    }
    return best ? [best.a, best.b] : [label];
  };
  const activeEdges = focus ? edges.filter((e) => e.partnerId === focus) : edges;

  const wrapLabel = (label: string, max = 18): string[] => {
    if (label.length <= max) return [label];
    const words = label.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const w of words) {
      if ((current + " " + w).trim().length > max && current) {
        lines.push(current.trim());
        current = w.length > max ? w.slice(0, max - 1) + "…" : w;
      } else {
        current = (current + " " + w).trim();
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, 3);
  };

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Capability coverage graph: required capabilities connected to selected partners"
      >
        <defs>
          <filter id="pglow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const active = !focus || e.partnerId === focus;
          const color = LEVEL_COLOR[e.level];
          const mx = (e.from.x + e.to.x) / 2;
          const path = `M ${e.from.x} ${e.from.y} C ${mx} ${e.from.y}, ${mx} ${e.to.y}, ${e.to.x} ${e.to.y}`;
          return (
            <motion.path
              key={`${e.partnerId}:${e.capId}`}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={focus === e.partnerId ? 2.2 : 1.4}
              strokeLinecap="round"
              initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: active ? (focus ? 0.95 : 0.55) : 0.08,
              }}
              transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : i * 0.02, ease: "easeOut" }}
              style={focus === e.partnerId ? { filter: "url(#pglow)" } : undefined}
            />
          );
        })}

        {/* Capability nodes */}
        {capNodes.map((n, i) => {
          const connected = focus ? activeEdges.some((e) => e.from.id === n.id) : false;
          const dimmed = focus && !connected;
          const cap = portfolio.capabilities.find((c) => `cap:${c.key}` === n.id);
          return (
            <motion.g
              key={n.id}
              initial={reduce ? undefined : { opacity: 0, x: -14 }}
              animate={{ opacity: dimmed ? 0.35 : 1, x: 0 }}
              transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : i * 0.05 }}
              onMouseEnter={() => setHovered(null)}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={connected ? 7 : 5}
                fill={connected ? "#1E4636" : "#E3DCCB"}
                stroke={connected ? "#2F6A4F" : "#1E4636"}
                strokeWidth={1.6}
              />
              {cap && cap.importance === "critical" && (
                <circle cx={n.x} cy={n.y} r={11} fill="none" stroke="#A87F2E" strokeWidth="1" opacity="0.5" strokeDasharray="2 3" />
              )}
              {wrapLabel(n.label, 18).map((line, li, lines) => (
                <text
                  key={li}
                  x={n.x - 16}
                  y={n.y + 4 + (li - (lines.length - 1) / 2) * 13}
                  textAnchor="end"
                  className="fill-[#5A6560]"
                  style={{ fontSize: 12.5, fontWeight: 500 }}
                >
                  {line}
                </text>
              ))}
            </motion.g>
          );
        })}

        {/* Partner nodes */}
        {partnerNodes.map((n, i) => {
          const active = focus === n.partnerId;
          const partner = partners.find((p) => p.id === n.partnerId);
          return (
            <motion.g
              key={n.id}
              initial={reduce ? undefined : { opacity: 0, x: 14 }}
              animate={{ opacity: focus && !active ? 0.35 : 1, x: 0 }}
              transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : i * 0.05 + 0.15 }}
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (selectedPartner === n.partnerId) {
                  const p = partners.find((x) => x.id === n.partnerId);
                  if (p && onOpenPartner) onOpenPartner(p);
                } else {
                  setSelectedPartner(n.partnerId ?? null);
                }
              }}
              onMouseEnter={() => setHovered(n.partnerId ?? null)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={active ? 30 : 26}
                fill={active ? "rgba(168,127,46,0.14)" : "#FCFAF4"}
                stroke={active ? "#A87F2E" : "rgba(44,52,49,0.3)"}
                strokeWidth={active ? 2 : 1.2}
              />
              {active && <circle cx={n.x} cy={n.y} r={30} fill="none" stroke="#A87F2E" strokeWidth="1" opacity="0.4" className="animate-pulse" />}
              <text
                x={n.x}
                y={n.y + 5}
                textAnchor="middle"
                className="fill-[#2C3431]"
                style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}
              >
                {(n.label.replace(/[^A-Za-z]/g, " ").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || "?").toUpperCase()}
              </text>
              <text
                x={n.x + 38}
                y={n.y + 4}
                className="fill-[#2C3431]"
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                {balancedSplit(n.label).map((line, li, lines) => (
                  <tspan key={li} x={n.x + 38} y={n.y + 4 + (li - (lines.length - 1) / 2) * 13}>
                    {line}
                  </tspan>
                ))}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Legend + hint */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] text-faint">
        <div className="flex flex-wrap items-center gap-4">
          {(["strong", "moderate", "emerging"] as const).map((l) => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: LEVEL_COLOR[l] }} />
              {l} contribution
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-warn/80 border-dashed" />
            critical capability
          </span>
        </div>
        {selectedPartner ? (
          <button
            type="button"
            className="text-brand-soft hover:text-foreground"
            onClick={() => setSelectedPartner(null)}
          >
            Clear selection
          </button>
        ) : (
          <span className="hidden sm:block">Click a partner node to inspect · click again to open the profile</span>
        )}
      </div>

      {/* Selection panel */}
      {selectedPartner && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-signal/25 bg-signal/5 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              {partners.find((p) => p.id === selectedPartner)?.name}
            </p>
            <Link
              href={`/partners/${selectedPartner}?analysis=${portfolio.analysis_id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-signal hover:text-brand-soft"
            >
              Open full profile <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {portfolio.selected
              .find((s) => s.partner_id === selectedPartner)
              ?.contributions.map((c) => (
                <span
                  key={c.capability_key}
                  className="rounded-md border px-2 py-0.5 text-[11px]"
                  style={{
                    borderColor: `${LEVEL_COLOR[c.level]}44`,
                    color: LEVEL_COLOR[c.level],
                    background: `${LEVEL_COLOR[c.level]}11`,
                  }}
                >
                  {c.level} · {c.capability_key.replace(/_/g, " ")}
                </span>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
