"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "indigo" | "emerald" | "rose" | "amber" | "default";
  badge?: string;
  badgeType?: "positive" | "negative" | "neutral";
}

const VARIANT_STYLES = {
  default: {
    bg: "bg-slate-900/60 border-slate-800",
    iconBg: "bg-slate-800 text-slate-300",
    value: "text-white",
  },
  indigo: {
    bg: "bg-slate-900/60 border-indigo-950/40 hover:border-indigo-900/60",
    iconBg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    value: "text-white",
  },
  emerald: {
    bg: "bg-slate-900/60 border-emerald-950/40 hover:border-emerald-900/60",
    iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    value: "text-emerald-400",
  },
  rose: {
    bg: "bg-slate-900/60 border-rose-950/40 hover:border-rose-900/60",
    iconBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    value: "text-rose-400",
  },
  amber: {
    bg: "bg-slate-900/60 border-amber-950/40 hover:border-amber-900/60",
    iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    value: "text-amber-400",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  badge,
  badgeType = "neutral",
}: MetricCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm transition-all duration-200 backdrop-blur-sm",
        styles.bg
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", styles.iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold tracking-tight font-mono", styles.value)}>
          {value}
        </span>
        {badge && (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
              badgeType === "positive" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
              badgeType === "negative" && "bg-rose-500/10 text-rose-400 border border-rose-500/20",
              badgeType === "neutral" && "bg-slate-800 text-slate-300 border border-slate-700"
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}

