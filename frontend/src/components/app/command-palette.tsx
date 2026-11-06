"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Network,
  PlusCircle,
  Radar,
  Rocket,
  Search,
  Settings,
  Building2,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getCachedResults } from "@/lib/api/client";
import { useWorkspace } from "@/lib/store";

const PAGES = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/new", label: "New ecosystem brief", icon: PlusCircle },
  { href: "/investigations", label: "Investigations", icon: Radar },
  { href: "/discovery", label: "Partner discovery", icon: Search },
  { href: "/portfolio", label: "Portfolio intelligence", icon: Network },
  { href: "/activation", label: "Activation workspace", icon: Rocket },
  { href: "/reports", label: "Executive report", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { analyses, activeAnalysisId } = useWorkspace();
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);

  // Load cached partner names for the active analysis (instant, no fetch).
  useEffect(() => {
    if (!open) return;
    const cached = activeAnalysisId ? getCachedResults(activeAnalysisId)?.partners : null;
    const items = cached ? cached.partners.map((p) => ({ id: p.id, name: p.name })) : [];
    // defer to a microtask to keep the effect body free of sync setState
    void Promise.resolve().then(() => setPartners(items));
  }, [open, activeAnalysisId]);

  const activeEntry = useMemo(
    () => analyses.find((a) => a.id === activeAnalysisId) ?? null,
    [analyses, activeAnalysisId],
  );

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="border-border bg-popover/95 backdrop-blur">
      <CommandInput placeholder="Search partners, pages and actions…" />
      <CommandList className="scrollbar-thin">
        <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
          Nothing found — try “portfolio” or a partner name.
        </CommandEmpty>

        {partners.length > 0 && activeEntry && (
          <CommandGroup heading={`Partners · ${activeEntry.company}`}>
            {partners.slice(0, 6).map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.name} partner`}
                onSelect={() => go(`/partners/${p.id}?analysis=${activeAnalysisId}`)}
                className="gap-2.5"
              >
                <Building2 className="size-4 text-faint" />
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Workspace">
          {PAGES.map((p) => (
            <CommandItem key={p.href} value={p.label} onSelect={() => go(p.href)} className="gap-2.5">
              <p.icon className="size-4 text-faint" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="bg-border" />

        <CommandGroup heading="Investigations">
          {analyses.slice(0, 5).map((a) => (
            <CommandItem
              key={a.id}
              value={`${a.title} ${a.company} ${a.product}`}
              onSelect={() => go(`/investigations/${a.id}`)}
              className="gap-2.5"
            >
              <Radar className="size-4 text-faint" />
              <span className="truncate">{a.company} — {a.product}</span>
              <span className="ml-auto text-[11px] text-faint">{a.status}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
