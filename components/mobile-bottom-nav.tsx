"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Wallet, Link as LinkIcon, Smartphone } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isSpecial?: boolean;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Deals", href: "/deals", icon: Sparkles },
  { name: "Convert", href: "/#convert", icon: LinkIcon, isSpecial: true },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Get App", href: "/app", icon: Smartphone },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  function isRouteActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    if (href === "/wallet") return pathname === "/wallet" || pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border/80 px-2 pt-1 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] shadow-xl"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isRouteActive(item.href);
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <a
                key={item.name}
                href={item.href}
                aria-label={item.name}
                className="flex flex-col items-center justify-center -mt-4 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-transform duration-150 active:scale-95 hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {item.name}
                </span>
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors duration-150 active:scale-95 ${
                active
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
