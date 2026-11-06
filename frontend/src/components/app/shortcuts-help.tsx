"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShortcutGroup {
  label: string;
  items: Array<{ keys: string[]; description: string }>;
}

const GROUPS: ShortcutGroup[] = [
  {
    label: "Global",
    items: [
      { keys: ["⌘", "K"], description: "Open the command palette — search partners, pages and actions" },
      { keys: ["?"], description: "Show this keyboard shortcuts reference" },
      { keys: ["Esc"], description: "Close dialogs, drawers and overlays" },
    ],
  },
  {
    label: "Navigation",
    items: [
      { keys: ["G", "O"], description: "Go to Overview" },
      { keys: ["G", "N"], description: "Go to New ecosystem" },
      { keys: ["G", "D"], description: "Go to Partner discovery" },
      { keys: ["G", "P"], description: "Go to Portfolio intelligence" },
      { keys: ["G", "A"], description: "Go to Activation workspace" },
      { keys: ["G", "R"], description: "Go to Executive report" },
    ],
  },
  {
    label: "Discovery",
    items: [
      { keys: ["T"], description: "Switch to table view" },
      { keys: ["C"], description: "Switch to card view" },
      { keys: ["/"], description: "Focus the search field" },
    ],
  },
];

const NAV_TARGETS: Record<string, string> = {
  o: "/overview",
  n: "/new",
  d: "/discovery",
  p: "/portfolio",
  a: "/activation",
  r: "/reports",
};

function Kbd({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="min-w-[24px] rounded-md border border-border bg-muted px-1.5 py-1 text-center font-mono text-[11px] font-medium text-muted-foreground"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.getAttribute("role") === "combobox" ||
          target.getAttribute("role") === "textbox");

      // Toggle this dialog with ? or Cmd+/ (but not while typing in a field).
      if (!isTyping && (e.key === "?" || ((e.metaKey || e.ctrlKey) && e.key === "/"))) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }

      // G+key navigation (sequential, not simultaneous).
      if (!isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "g") {
          // Stage: wait for the next key.
          const onNext = (e2: KeyboardEvent) => {
            window.removeEventListener("keydown", onNext, true);
            const k2 = e2.key.toLowerCase();
            if (NAV_TARGETS[k2] && !e2.metaKey && !e2.ctrlKey && !e2.altKey) {
              e2.preventDefault();
              window.location.href = NAV_TARGETS[k2];
            }
          };
          window.addEventListener("keydown", onNext, { capture: true, once: true });
          // Clean up if no second key within 800ms.
          setTimeout(() => window.removeEventListener("keydown", onNext, true), 800);
        }

        // Discovery view shortcuts (only on /discovery).
        if (window.location.pathname === "/discovery") {
          if (key === "t" || key === "c") {
            const url = new URL(window.location.href);
            url.searchParams.set("view", key === "t" ? "table" : "cards");
            window.history.replaceState(null, "", url.toString());
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
          if (key === "/") {
            e.preventDefault();
            const input = document.querySelector<HTMLInputElement>(
              'input[placeholder*="Search name"]',
            );
            input?.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-border bg-popover/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="text-brand-soft">⌨</span> Keyboard shortcuts
          </DialogTitle>
          <DialogDescription className="text-xs">
            Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">?</kbd> anywhere in the workspace to open this reference.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                {group.label}
              </p>
              <dl className="space-y-2">
                {group.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <dt className="text-[13px] text-muted-foreground">{item.description}</dt>
                    <dd className="shrink-0">
                      <Kbd keys={item.keys} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
