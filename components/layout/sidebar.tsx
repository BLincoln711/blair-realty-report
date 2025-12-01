"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  CompassIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  ShieldIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/topics", label: "Topics", icon: CompassIcon },
  { href: "/brands", label: "Brands", icon: ShieldIcon },
  { href: "/alerts", label: "Alerts", icon: BellIcon },
  { href: "/settings", label: "Settings", icon: Settings2Icon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-card/50 p-6 md:flex">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
          CA
        </div>
        <div>
          <p className="text-base font-semibold">citia.ai</p>
          <p className="text-sm text-muted-foreground">AI visibility OS</p>
        </div>
      </div>
      <nav className="space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === href
              : pathname?.startsWith(href ?? "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {href === "/alerts" && (
                <Badge variant="secondary" className="text-xs uppercase">
                  live
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Coverage Tracker</p>
        <p className="mt-1 text-muted-foreground">
          Monitor Google AI Overviews, Perplexity, and ChatGPT Search in one
          place.
        </p>
      </div>
    </aside>
  );
}

