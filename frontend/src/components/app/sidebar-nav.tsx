"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Network,
  PlusCircle,
  Radar,
  Rocket,
  Search,
  Settings,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/store";
import { IS_DEMO } from "@/lib/api/client";

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/new", label: "New ecosystem", icon: PlusCircle },
  { href: "/investigations", label: "Investigations", icon: Radar },
  { href: "/discovery", label: "Partner discovery", icon: Search },
  { href: "/portfolio", label: "Portfolio intelligence", icon: Network },
  { href: "/activation", label: "Activation workspace", icon: Rocket },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const analyses = useWorkspace((s) => s.analyses);
  const running = analyses.filter((a) => a.status === "queued" || a.status === "running").length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5" aria-label="ALLIOME home">
          <LogoMark size={26} />
          <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
            ALLI<span className="text-[#9CC5AC]">OME</span>
          </span>
        </Link>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3" aria-label="Workspace">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-all",
                active
                  ? "bg-[rgba(237,232,217,0.12)] text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_rgba(156,197,172,0.35)]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "size-4 transition-colors",
                  active ? "text-[#9CC5AC]" : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.href === "/investigations" && running > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-signal/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#C9A85C]">
                  <span className="size-1.5 animate-pulse rounded-full bg-signal" />
                  {running}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            "rounded-lg border px-3 py-2.5",
            IS_DEMO ? "border-warn/20 bg-warn/5" : "border-mint/20 bg-mint/5",
          )}
        >
          <p className={cn("text-[11px] font-semibold uppercase tracking-wider", IS_DEMO ? "text-warn" : "text-mint")}>
            {IS_DEMO ? "Mock mode" : "Live backend"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/70">
            {IS_DEMO
              ? "All records are synthetic demo data (dev & tests). Connect the FastAPI backend in Settings."
              : "Connected to the FastAPI backend — live research data."}
          </p>
        </div>
      </div>
    </div>
  );
}
