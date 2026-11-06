"use client";

/**
 * EcosystemCanvas — the ALLIOME hero visualization.
 *
 * An interactive pseudo-3D business-ecosystem network rendered on a 2D canvas
 * with perspective projection: a central company node, orbiting partner-
 * category nodes, candidate company nodes, glowing connections and particles
 * indicating information flow.
 *
 * Interaction model (true 3D camera control):
 *  - Drag anywhere to rotate the whole network; release to spin with inertia.
 *  - Auto-rotation gently eases back in after a few seconds of idleness.
 *  - Hover a node to spotlight it and its connections; click to pin the
 *    spotlight, click again (or empty space) to release.
 *  - Zoom with the on-canvas controls or ctrl/⌘ + scroll wheel.
 *
 * Engineering notes:
 *  - 2D canvas + manual 3D projection: ~17 nodes / ~20 edges / 24 particles
 *    render at 60fps on ordinary laptops without a WebGL engine.
 *  - Pauses via IntersectionObserver when off-screen; caps DPR at 1.75.
 *  - prefers-reduced-motion: no auto-rotation, particles or inertia — the
 *    scene renders static frames and only animates while actively dragged.
 *  - Falls back to a static SVG network when canvas is unavailable.
 */

import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Node3 {
  id: string;
  label: string;
  subtitle: string;
  radius: number;
  elevation: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  glow: string;
  role: "center" | "category" | "company";
  parent?: string;
}

interface Particle {
  edge: number;
  t: number;
  speed: number;
  size: number;
}

interface Projected {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  scale: number;
}

/* Palette — designed for the deep forest hero card. */
const CREAM = "#EDE8D9";
const BRASS = "#C9A85C";
const SAGE = "#9CC5AC";
const TERRA = "#D08A5E";

const CATEGORIES = [
  { id: "consulting", label: "Consulting", angle: -0.4 },
  { id: "integration", label: "System integration", angle: 1.2 },
  { id: "cloud", label: "Cloud", angle: 2.7 },
  { id: "distribution", label: "Distribution", angle: 4.3 },
];

const COMPANY_NAMES = [
  ["RhineForge", "Meridian Advisory", "Kestrel Partners", "Vantage/32"],
  ["NordWerk", "SysLogic", "Baltic Digital", "CoreStack"],
  ["AlpenCloud", "Cumulus Nine", "GreenField"],
  ["HanseTech", "Delta Channel", "Vertrieb+"],
];
const COMPANY_COUNTS = [4, 4, 3, 3];
const COMPANY_COLORS = [BRASS, SAGE, "#E3CE9A", TERRA];

function buildNodes(): Node3[] {
  const nodes: Node3[] = [
    {
      id: "center",
      label: "Your company",
      subtitle: "market-entry ecosystem",
      radius: 0,
      elevation: 0,
      angle: 0,
      speed: 0,
      size: 15,
      color: "#F2ECD8",
      glow: BRASS,
      role: "center",
    },
  ];
  CATEGORIES.forEach((c, i) => {
    nodes.push({
      id: c.id,
      label: c.label,
      subtitle: "partner category",
      radius: 118,
      elevation: (i % 2 === 0 ? -1 : 1) * 44,
      angle: c.angle,
      speed: 0.05 * (i % 2 === 0 ? 1 : -1) + 0.02,
      size: 7.5,
      color: SAGE,
      glow: SAGE,
      role: "category",
      parent: "center",
    });
  });
  CATEGORIES.forEach((c, ci) => {
    for (let i = 0; i < COMPANY_COUNTS[ci]; i++) {
      const spread = 0.62;
      nodes.push({
        id: `${c.id}-co-${i}`,
        label: COMPANY_NAMES[ci][i],
        subtitle: `candidate · ${c.label.toLowerCase()}`,
        radius: 196 + (i % 2) * 26,
        elevation: ((i + 1) % 3 - 1) * 90 + (ci % 2 === 0 ? -18 : 20),
        angle: c.angle + (i - (COMPANY_COUNTS[ci] - 1) / 2) * spread,
        speed: (0.05 * (ci % 2 === 0 ? 1 : -1) + 0.02) * (0.75 + ((i * 7) % 5) / 10),
        size: 3.6 + ((i * 3) % 3),
        color: COMPANY_COLORS[(ci + i) % COMPANY_COLORS.length],
        glow: COMPANY_COLORS[(ci + i) % COMPANY_COLORS.length],
        role: "company",
        parent: c.id,
      });
    }
  });
  return nodes;
}

function buildParticles(edgeCount: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 22; i++) {
    particles.push({
      edge: i % edgeCount,
      t: Math.random(),
      speed: 0.0022 + Math.random() * 0.003,
      size: 1.1 + Math.random() * 1.1,
    });
  }
  return particles;
}

function EcosystemFallback() {
  return (
    <svg viewBox="0 0 480 400" className="size-full" aria-hidden="true">
      <defs>
        <linearGradient id="fbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SAGE} />
          <stop offset="1" stopColor={BRASS} />
        </linearGradient>
      </defs>
      {[
        [240, 200, 130, 120],
        [240, 200, 350, 120],
        [240, 200, 110, 280],
        [240, 200, 360, 290],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#fbg)" strokeWidth="1" opacity="0.45" />
      ))}
      <circle cx="240" cy="200" r="14" fill="#F2ECD8" />
      {[
        [130, 120],
        [350, 120],
        [110, 280],
        [360, 290],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="6" fill={SAGE} opacity="0.95" />
      ))}
      {[
        [90, 80],
        [170, 60],
        [390, 170],
        [60, 180],
        [300, 350],
        [420, 340],
        [150, 340],
        [280, 40],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={[BRASS, SAGE, TERRA][i % 3]} opacity="0.8" />
      ))}
    </svg>
  );
}

const ZOOM_MIN = 0.65;
const ZOOM_MAX = 1.5;

export function EcosystemCanvas({
  className,
  interactive = true,
}: {
  className?: string;
  interactive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // for control state
  const [showHint, setShowHint] = useState(true); // "drag to explore"

  // Zoom control handlers (work even if the canvas effect failed)
  const zoomApi = useRef<{ zoomBy: (f: number) => void; reset: () => void } | null>(null);
  const handleZoomIn = () => zoomApi.current?.zoomBy(1.18);
  const handleZoomOut = () => zoomApi.current?.zoomBy(1 / 1.18);
  const handleReset = () => zoomApi.current?.reset();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let ctx: CanvasRenderingContext2D;
    try {
      const maybe = canvas.getContext("2d");
      if (!maybe) throw new Error("no 2d context");
      ctx = maybe;
    } catch {
      setFailed(true);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = buildNodes();
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const edges = nodes
      .filter((n) => n.parent)
      .map((n) => ({ from: nodeById.get(n.parent!)!, to: n }));
    const flowEdges = edges.filter((e) => e.to.role === "category").map((e) => edges.indexOf(e));
    const particles = buildParticles(flowEdges.length);

    // Adjacency for spotlight highlighting
    const adjacent = new Map<string, Set<string>>();
    const addAdj = (a: string, b: string) => {
      if (!adjacent.has(a)) adjacent.set(a, new Set());
      if (!adjacent.has(b)) adjacent.set(b, new Set());
      adjacent.get(a)!.add(b);
      adjacent.get(b)!.add(a);
    };
    for (const e of edges) addAdj(e.from.id, e.to.id);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let running = false;

    // Camera / interaction state
    const BASE_ROT = { y: 0.6, x: -0.52 };
    const rot = { ...BASE_ROT };
    let zoomTarget = 1;
    let zoomCur = 1;
    let resetting = false;
    const vel = { x: 0, y: 0 };
    const drag = { active: false, moved: 0, lastX: 0, lastY: 0 };
    const pointer = { x: -1, y: -1, inside: false };
    let lastInteract = -10000;
    let autoW = reduceMotion ? 0 : 1;
    let hoveredId: string | null = null;
    let selectedId: string | null = null;

    const FOV = 430;
    const CAMERA = 340;
    const Y_STRETCH = 1.22; // card is wider than tall — stretch orbits to fill
    // World scale adapts to the canvas size so mobile cards stay balanced
    let worldScale = 1.65;

    const project = (x: number, y: number, z: number): Projected => {
      const scale = ((FOV * zoomCur) / (FOV + z + CAMERA)) * worldScale;
      return {
        x,
        y,
        z,
        sx: width / 2 + x * scale,
        sy: height / 2 + y * scale * Y_STRETCH,
        scale,
      };
    };

    const projected = new Map<string, Projected>();

    const drawFrame = (time: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // ── Camera dynamics ─────────────────────────────────────
      zoomCur += (zoomTarget - zoomCur) * 0.14;
      if (resetting) {
        rot.y += (BASE_ROT.y - rot.y) * 0.12;
        rot.x += (BASE_ROT.x - rot.x) * 0.12;
        if (Math.abs(BASE_ROT.y - rot.y) < 0.002 && Math.abs(BASE_ROT.x - rot.x) < 0.002) {
          rot.y = BASE_ROT.y;
          rot.x = BASE_ROT.x;
          resetting = false;
        }
      }
      if (!reduceMotion) {
        rot.y += vel.x;
        rot.x += vel.y;
        vel.x *= 0.94;
        vel.y *= 0.94;
        if (Math.abs(vel.x) < 0.00005) vel.x = 0;
        if (Math.abs(vel.y) < 0.00005) vel.y = 0;
        // Ease auto-rotation back in after idle
        const wantAuto = time - lastInteract > 3500 && !drag.active ? 1 : 0;
        autoW += (wantAuto - autoW) * 0.02;
        rot.y += 0.0016 * autoW;
      }
      rot.x = Math.max(-1.25, Math.min(1.25, rot.x));

      const rotY = rot.y;
      const rotX = rot.x;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // ── Compute node positions ──────────────────────────────
      for (const n of nodes) {
        const angle = reduceMotion
          ? n.angle
          : n.angle + time * 0.001 * (Math.abs(n.speed) * 6 + 0.35) * Math.sign(n.speed || 1);
        const x0 = Math.cos(angle) * n.radius;
        const z0 = Math.sin(angle) * n.radius;
        const x1 = x0 * cosY - z0 * sinY;
        const z1 = x0 * sinY + z0 * cosY;
        const y1 = n.elevation * cosX - z1 * sinX;
        const z2 = n.elevation * sinX + z1 * cosX;
        projected.set(n.id, project(x1, y1, z2));
      }

      // ── Hover detection (nearest node under pointer) ────────
      let newHovered: string | null = null;
      if (interactive && pointer.inside && !drag.active) {
        let best = Infinity;
        for (const n of nodes) {
          const p = projected.get(n.id)!;
          const d = Math.hypot(p.sx - pointer.x, p.sy - pointer.y);
          const hit = Math.max(16, n.size * p.scale + 10);
          if (d < hit && d < best) {
            best = d;
            newHovered = n.id;
          }
        }
      }
      hoveredId = newHovered;
      const focusId = selectedId ?? hoveredId;
      const focusAdj = focusId ? adjacent.get(focusId) : null;

      wrap.style.cursor = drag.active
        ? "grabbing"
        : !interactive
          ? "default"
          : hoveredId
            ? "pointer"
            : "grab";

      // ── Orbit rings (structure hint) ────────────────────────
      ctx.save();
      for (const [rid, rAlpha] of [
        [118, 0.2],
        [200, 0.13],
      ] as const) {
        ctx.beginPath();
        const pts: [number, number][] = [];
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) {
          const x0 = Math.cos(a) * rid;
          const z0 = Math.sin(a) * rid;
          const x1 = x0 * cosY - z0 * sinY;
          const z1 = x0 * sinY + z0 * cosY;
          const y1 = -z1 * sinX;
          const z2 = z1 * cosX;
          const p = project(x1, y1, z2);
          pts.push([p.sx, p.sy]);
        }
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (const [px, py] of pts) ctx.lineTo(px, py);
        ctx.strokeStyle = `rgba(237, 232, 217, ${rAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // ── Edges ───────────────────────────────────────────────
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const a = projected.get(e.from.id)!;
        const b = projected.get(e.to.id)!;
        const depth = (a.scale + b.scale) / 2;
        let alpha = Math.max(0.05, Math.min(0.5, (depth - 0.45) * 1.1));
        let lineWidth = Math.max(0.5, depth * 1.4);

        const connected =
          focusId != null &&
          focusAdj != null &&
          (e.from.id === focusId || e.to.id === focusId ||
            (e.from.id === focusId && focusAdj.has(e.to.id)) ||
            (e.to.id === focusId && focusAdj.has(e.from.id)));
        if (focusId != null) {
          alpha = connected ? Math.min(0.85, alpha * 2.1) : alpha * 0.3;
          lineWidth = connected ? lineWidth * 1.5 : lineWidth * 0.8;
        }

        const grad = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy);
        grad.addColorStop(0, `rgba(237, 232, 217, ${alpha})`);
        grad.addColorStop(1, `rgba(156, 197, 172, ${alpha * 0.9})`);
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Data-flow dash on category edges
        if (flowEdges.includes(i) && !reduceMotion) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.setLineDash([2, 10]);
          ctx.lineDashOffset = -time * 0.02;
          ctx.strokeStyle = `rgba(201, 168, 92, ${Math.min(0.9, alpha * 1.5)})`;
          ctx.lineWidth = connected ? 1.6 : 1;
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── Particles along category edges (information flow) ───
      if (!reduceMotion) {
        for (const p of particles) {
          const edge = edges[flowEdges[p.edge % flowEdges.length]];
          const a = projected.get(edge.from.id)!;
          const b = projected.get(edge.to.id)!;
          p.t += p.speed;
          if (p.t > 1) p.t = 0;
          const t = p.t;
          const sx = a.sx + (b.sx - a.sx) * t;
          const sy = a.sy + (b.sy - a.sy) * t;
          const depth = a.scale + (b.scale - a.scale) * t;
          ctx.beginPath();
          ctx.arc(sx, sy, p.size * depth, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(201, 168, 92, ${0.55 * depth})`;
          ctx.fill();
        }
      }

      // ── Nodes (far to near) ─────────────────────────────────
      const sorted = [...nodes].sort((n1, n2) => projected.get(n2.id)!.z - projected.get(n1.id)!.z);
      for (const n of sorted) {
        const p = projected.get(n.id)!;
        const s = n.size * p.scale;
        let alpha = Math.max(0.25, Math.min(1, (p.scale - 0.45) * 2.2));
        const isFocus = n.id === focusId;
        const isConnected = focusId != null && focusAdj != null && focusAdj.has(n.id);
        if (focusId != null && !isFocus && !isConnected) alpha *= 0.35;
        if (isFocus) alpha = 1;
        if (isFocus) {
          // scale the focused node up slightly
          const boost = 1 + 0.18;
          ctx.save();
          ctx.translate(p.sx, p.sy);
          ctx.scale(boost, boost);
          ctx.translate(-p.sx, -p.sy);
        }

        // glow
        const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, s * 4);
        glow.addColorStop(0, `${n.glow}${Math.round(alpha * (isFocus ? 150 : 110)).toString(16).padStart(2, "0")}`);
        glow.addColorStop(1, `${n.glow}00`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, s * 4, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, s, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        // rim light
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, s, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(18, 44, 31, ${0.35 * alpha})`;
        ctx.lineWidth = Math.max(0.5, s * 0.14);
        ctx.stroke();

        // pulsing ring on center
        if (n.role === "center") {
          const pulse = reduceMotion ? 0 : (time * 0.001) % 1;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, s + pulse * 26, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(201, 168, 92, ${(1 - pulse) * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // selection ring on focused node
        if (isFocus) {
          const spin = reduceMotion ? 0 : time * 0.0012;
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 5]);
          ctx.lineDashOffset = -spin * 24;
          ctx.arc(p.sx, p.sy, s + 8, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(242, 236, 216, 0.9)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }

        if (isFocus) ctx.restore();

        // labels — only the center and category nodes carry persistent labels;
        // candidate companies are revealed on hover / selection (tooltip),
        // which keeps the scene clean and legible.
        if (n.role !== "company") {
          // On very small canvases, category labels add clutter — keep only the center
          if (width < 420 && n.role === "category") continue;
          const centerPos = projected.get("center")!;
          const nearCenter =
            n.role === "category" &&
            Math.abs(p.sy - centerPos.sy) < 52 &&
            Math.abs(p.sx - centerPos.sx) < 110;
          if (!nearCenter) {
            // Skip labels that would be clipped by the canvas bounds
            if (n.role !== "center") {
              const approxBottom = p.sy + s + 15 * p.scale + 6;
              const approxTop = p.sy - s - 10 * p.scale - 6;
              if (approxBottom > height || approxTop < 0) continue;
            }
            const labelAlpha =
              focusId != null && !isFocus && !isConnected
                ? alpha * 0.6
                : n.role === "center"
                  ? 1
                  : 0.95;
            const fontSize = Math.max(10, (n.role === "center" ? 13 : 11) * p.scale);
            ctx.font = `${n.role === "center" ? 600 : 500} ${fontSize}px var(--font-geist-sans, sans-serif)`;
            ctx.textAlign = "center";
            const midY = height / 2;
            const labelY =
              n.role === "center"
                ? p.sy + s + 16 * p.scale
                : p.sy < midY
                  ? p.sy - s - 10 * p.scale
                  : p.sy + s + 15 * p.scale;
            // Backing plate for legibility
            const tw = ctx.measureText(n.label).width;
            ctx.fillStyle = `rgba(13, 31, 22, ${0.9 * labelAlpha})`;
            ctx.beginPath();
            ctx.roundRect(p.sx - tw / 2 - 5, labelY - fontSize + 1, tw + 10, fontSize + 5, 5);
            ctx.fill();
            ctx.fillStyle = `rgba(237, 232, 217, ${labelAlpha})`;
            ctx.fillText(n.label, p.sx, labelY);
            if (n.role === "center") {
              const sub = n.subtitle;
              ctx.font = `500 ${Math.max(9.5, 10.5 * p.scale)}px var(--font-geist-sans, sans-serif)`;
              const sw = ctx.measureText(sub).width;
              const sy2 = labelY + 15 * p.scale;
              ctx.fillStyle = `rgba(13, 31, 22, ${0.9 * labelAlpha})`;
              ctx.beginPath();
              ctx.roundRect(p.sx - sw / 2 - 5, sy2 - 10 * p.scale + 1, sw + 10, 10 * p.scale + 5, 5);
              ctx.fill();
              ctx.fillStyle = `rgba(214, 233, 219, ${labelAlpha})`;
              ctx.fillText(sub, p.sx, sy2);
            }
          }
        }
      }

      // ── Tooltip for hovered / focused node ──────────────────
      // Center and category nodes carry persistent labels already;
      // the tooltip reveals the unnamed candidate company nodes.
      const tipId = hoveredId ?? selectedId;
      if (interactive && tipId && nodeById.get(tipId)?.role === "company") {
        const n = nodeById.get(tipId)!;
        const p = projected.get(tipId)!;
        const conn = adjacent.get(tipId)?.size ?? 0;
        const l1 = n.label;
        const l2 =
          n.role === "company"
            ? `${n.subtitle} · ${conn} link${conn === 1 ? "" : "s"}`
            : n.subtitle;
        const fs1 = 12.5;
        const fs2 = 10;
        ctx.font = `600 ${fs1}px var(--font-geist-sans, sans-serif)`;
        const w1 = ctx.measureText(l1).width;
        ctx.font = `500 ${fs2}px var(--font-geist-sans, sans-serif)`;
        const w2 = ctx.measureText(l2).width;
        const bw = Math.max(w1, w2) + 20;
        const bh = fs1 + fs2 + 15;
        let bx = Math.min(Math.max(8, p.sx - bw / 2), width - bw - 8);
        const above = p.sy > 74;
        let by = above ? p.sy - 14 - bh : p.sy + 14;
        by = Math.max(8, Math.min(by, height - bh - 8));

        ctx.fillStyle = "rgba(13, 31, 22, 0.92)";
        ctx.strokeStyle = "rgba(201, 168, 92, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(242, 236, 216, 0.98)";
        ctx.font = `600 ${fs1}px var(--font-geist-sans, sans-serif)`;
        ctx.fillText(l1, bx + 10, by + fs1 + 4);
        ctx.fillStyle = "rgba(156, 197, 172, 0.9)";
        ctx.font = `500 ${fs2}px var(--font-geist-sans, sans-serif)`;
        ctx.fillText(l2, bx + 10, by + fs1 + fs2 + 9);
      }
    };

    const loop = (time: number) => {
      if (!running) return;
      drawFrame(time);
      if (reduceMotion) {
        // Reduced motion: keep rendering only while the user interacts
        const busy =
          drag.active ||
          Math.abs(vel.x) > 0 || Math.abs(vel.y) > 0 ||
          Math.abs(zoomCur - zoomTarget) > 0.002 || resetting;
        if (busy) {
          raf = requestAnimationFrame(loop);
        } else {
          running = false;
        }
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    const kick = () => {
      if (running || !visible) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = rect.width;
      height = rect.height;
      // Shrink the world on small canvases (mobile) so the scene stays centered
      worldScale = Math.min(1.65, Math.max(1.0, width / 380));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (reduceMotion) {
        kick();
        drawFrame(performance.now());
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) kick();
        else {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.05 },
    );
    io.observe(wrap);

    if (reduceMotion) {
      kick();
      drawFrame(performance.now());
      running = false;
      cancelAnimationFrame(raf);
    } else {
      kick();
    }

    // ── Pointer interaction ────────────────────────────────────
    const localPos = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e: PointerEvent) => {
      if (!interactive) return;
      const lp = localPos(e);
      drag.active = true;
      drag.moved = 0;
      drag.lastX = lp.x;
      drag.lastY = lp.y;
      lastInteract = performance.now();
      setShowHint(false);
      if (reduceMotion) kick();
      try {
        wrap.setPointerCapture(e.pointerId);
      } catch {
        /* pointer capture unsupported */
      }
    };

    const onMove = (e: PointerEvent) => {
      const lp = localPos(e);
      pointer.x = lp.x;
      pointer.y = lp.y;
      pointer.inside = true;
      if (!interactive) return;
      if (drag.active) {
        const dx = lp.x - drag.lastX;
        const dy = lp.y - drag.lastY;
        drag.lastX = lp.x;
        drag.lastY = lp.y;
        drag.moved += Math.abs(dx) + Math.abs(dy);
        rot.y += dx * 0.0042;
        rot.x += dy * 0.0032;
        if (!reduceMotion) {
          vel.x = dx * 0.0042 * 0.6;
          vel.y = dy * 0.0032 * 0.6;
        }
        lastInteract = performance.now();
        resetting = false;
        if (reduceMotion) kick();
      } else if (reduceMotion) {
        // hover feedback needs a redraw in reduced-motion mode
        kick();
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!interactive) return;
      const wasDrag = drag.active;
      drag.active = false;
      lastInteract = performance.now();
      try {
        wrap.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      // Click (not drag) → toggle selection on the hovered node
      if (wasDrag && drag.moved < 6) {
        if (selectedId) {
          selectedId = null;
        } else if (hoveredId) {
          selectedId = hoveredId;
        }
        if (reduceMotion) kick();
      }
    };

    const onLeave = () => {
      pointer.inside = false;
      hoveredId = null;
      if (reduceMotion) kick();
    };

    const onWheel = (e: WheelEvent) => {
      if (!interactive) return;
      if (!e.ctrlKey && !e.metaKey) return; // let the page scroll
      e.preventDefault();
      zoomTarget = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomTarget * (1 - e.deltaY * 0.0018)));
      setZoomLevel(zoomTarget);
      lastInteract = performance.now();
      if (reduceMotion) kick();
    };

    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("wheel", onWheel, { passive: false });

    // Expose zoom controls to React overlay buttons
    zoomApi.current = {
      zoomBy: (f: number) => {
        zoomTarget = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomTarget * f));
        setZoomLevel(zoomTarget);
        lastInteract = performance.now();
        if (reduceMotion) kick();
      },
      reset: () => {
        zoomTarget = 1;
        setZoomLevel(1);
        selectedId = null;
        resetting = true;
        vel.x = 0;
        vel.y = 0;
        lastInteract = performance.now();
        if (reduceMotion) kick();
      },
    };

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("wheel", onWheel);
      zoomApi.current = null;
    };
  }, [interactive]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative size-full touch-pan-y select-none", className)}
      aria-label="Interactive 3D ecosystem network — drag to rotate, hover nodes for details"
      role="img"
    >
      {failed ? (
        <EcosystemFallback />
      ) : (
        <>
          <canvas ref={canvasRef} className="block size-full" />

          {/* Zoom controls */}
          {interactive && !failed && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg border border-white/15 bg-[#0d1f16]/80 p-0.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= ZOOM_MIN + 0.01}
                aria-label="Zoom out"
                className="grid size-7 place-items-center rounded-md text-[#EDE8D9]/80 transition-colors hover:bg-white/10 hover:text-[#EDE8D9] disabled:opacity-30"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= ZOOM_MAX - 0.01}
                aria-label="Zoom in"
                className="grid size-7 place-items-center rounded-md text-[#EDE8D9]/80 transition-colors hover:bg-white/10 hover:text-[#EDE8D9] disabled:opacity-30"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <div className="h-4 w-px bg-white/15" />
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset view"
                className="grid size-7 place-items-center rounded-md text-[#EDE8D9]/80 transition-colors hover:bg-white/10 hover:text-[#EDE8D9]"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          )}

          {/* First-visit hint (centered bottom, clear of the coverage chip) */}
          {interactive && showHint && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-[#0d1f16]/85 px-3 py-1 text-[10.5px] font-medium text-[#EDE8D9]/90 backdrop-blur-sm">
              <MousePointer2 className="size-3" />
              Drag to explore
            </div>
          )}
        </>
      )}
    </div>
  );
}
