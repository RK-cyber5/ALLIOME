"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowRight, Compass, ShieldCheck, Network, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EcosystemCanvas } from "./ecosystem-canvas";

const PROMISE_STEPS = [
  { icon: Compass, label: "Discover the right partners" },
  { icon: ShieldCheck, label: "Prove the fit" },
  { icon: Network, label: "Build the ecosystem" },
  { icon: Rocket, label: "Activate new revenue channels" },
];

export function Hero() {
  const reduce = useReducedMotion();
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  // Subtle 3D tilt on the visual card
  const tiltX = useSpring(useMotionValue(0), { stiffness: 160, damping: 22 });
  const tiltY = useSpring(useMotionValue(0), { stiffness: 160, damping: 22 });
  const onCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    tiltY.set(nx * 3.5);
    tiltX.set(-ny * 3.5);
  };
  const onCardLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <section className="relative overflow-hidden pt-16">
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-dots [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]" />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand/10 blur-[140px]" />
        <div className="absolute right-[8%] top-1/3 h-72 w-72 rounded-full bg-signal/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:px-8 lg:pt-24">
        {/* Copy */}
        <div className="max-w-xl">
          <motion.div {...fadeUp(0)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/8 px-3 py-1 text-xs font-medium text-brand">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-signal" />
                <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
              </span>
              Ecosystem intelligence for B2B AI &amp; software
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className="mt-5 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]"
          >
            Engineer the <span className="text-gradient">right ecosystem.</span>
          </motion.h1>

          <motion.p {...fadeUp(0.16)} className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Find the right partners, prove the fit, and turn market entry into an
            activation plan.
          </motion.p>

          <motion.div {...fadeUp(0.24)} className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild className="h-11 px-6 font-medium">
              <Link href="/new">
                Engineer my ecosystem
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-11 px-6">
              <a href="#capabilities">Explore capabilities</a>
            </Button>
          </motion.div>

          <motion.ul {...fadeUp(0.32)} className="mt-10 grid gap-2.5 sm:grid-cols-2">
            {PROMISE_STEPS.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="grid size-6 shrink-0 place-items-center rounded-md border border-border bg-surface-2">
                  <s.icon className="size-3 text-brand-soft" />
                </span>
                {s.label}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Visualization — deep forest panel with interactive 3D network */}
        <motion.div
          initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduce ? 0 : 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <motion.div
            onMouseMove={onCardMove}
            onMouseLeave={onCardLeave}
            style={reduce ? undefined : { rotateX: tiltX, rotateY: tiltY, transformPerspective: 1100 }}
            className="card-sheen relative aspect-[5/4] overflow-hidden rounded-2xl border border-[#0d2419] bg-gradient-to-br from-[#1c4231] via-[#16362a] to-[#0f2a1f] shadow-[0_24px_70px_-24px_rgba(20,50,38,0.55)]"
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A85C]/50 to-transparent" />
            {/* Soft studio lighting + vignette for depth */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 75% 65% at 50% 42%, rgba(78,132,105,0.28), transparent 70%), radial-gradient(ellipse 120% 100% at 50% 50%, transparent 55%, rgba(8,24,17,0.55) 100%)",
              }}
              aria-hidden="true"
            />
            <EcosystemCanvas className="absolute inset-0" />

            {/* Floating evidence chips */}
            <div className="pointer-events-none absolute left-4 top-4 hidden rounded-lg border border-white/15 bg-[#0d1f16]/85 px-3 py-2 backdrop-blur sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CC5AC]">Candidate partner</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs font-medium text-[#EDE8D9]">
                <span className="size-1.5 rounded-full bg-[#7FC9A2]" />
                Strategic fit 92 · evidence verified
              </p>
            </div>
            <div className="pointer-events-none absolute bottom-4 right-4 hidden rounded-lg border border-white/15 bg-[#0d1f16]/85 px-3 py-2 backdrop-blur sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CC5AC]">Portfolio coverage</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs font-medium text-[#EDE8D9]">
                <span className="size-1.5 rounded-full bg-[#C9A85C]" />
                6/6 capabilities · 4 partners
              </p>
            </div>
          </motion.div>
          <p className="mt-3 text-center text-[11px] text-faint lg:text-left">
            Illustrative demo network — drag to rotate, hover a node.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
