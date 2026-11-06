"use client";

import React from "react";
import { formatCurrency } from "@/lib/currency";
import { Repeat, UserCheck, Zap, Sparkles } from "lucide-react";

interface RenewalRatioChartProps {
  initialOrders: number;
  initialRevenue: number;
  trialConversions?: number;
  directPurchases?: number;
  renewalOrders: number;
  renewalRevenue: number;
  renewalShare: number;
}

export function RenewalRatioChart({
  initialOrders,
  initialRevenue,
  trialConversions = 0,
  directPurchases = 0,
  renewalOrders,
  renewalRevenue,
  renewalShare,
}: RenewalRatioChartProps) {
  const totalOrders = initialOrders + renewalOrders;
  const initialOrderShare = totalOrders > 0 ? (initialOrders / totalOrders) * 100 : 0;
  const renewalOrderShare = totalOrders > 0 ? (renewalOrders / totalOrders) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">First-Time Conversions vs Recurring Renewals</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking initial paying conversions (Direct & 3-day Trial conversions <code className="text-indigo-400">..0</code>) vs recurring renewals (<code className="text-emerald-400">..1+</code>)
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-right">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
            Renewal Rev Share
          </span>
          <span className="text-lg font-mono font-bold text-emerald-300">
            {renewalShare.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Dual Progress Bar */}
      <div className="space-y-2 mt-4">
        <div className="h-4 w-full rounded-xl bg-slate-800 overflow-hidden flex p-0.5 border border-slate-800">
          <div
            className="h-full rounded-l-lg bg-indigo-500 transition-all duration-500"
            style={{ width: `${Math.max(5, initialOrderShare)}%` }}
            title={`First-Time Conversions: ${initialOrderShare.toFixed(1)}%`}
          />
          <div
            className="h-full rounded-r-lg bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.max(5, renewalOrderShare)}%` }}
            title={`Recurring Renewals: ${renewalOrderShare.toFixed(1)}%`}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-mono px-1">
          <span>First-Time Paid Conversions ({initialOrderShare.toFixed(1)}%)</span>
          <span>Recurring Renewals ({renewalOrderShare.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Cards comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase">
              <UserCheck className="h-4 w-4" />
              <span>New Paying Customers</span>
            </div>
            {trialConversions > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <Sparkles className="h-3 w-3" />
                <span>{trialConversions} Trial Conversions</span>
              </span>
            )}
          </div>
          <p className="text-xl font-bold font-mono text-white mt-2">
            {formatCurrency(initialRevenue)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {initialOrders} users ({trialConversions} converted from trial <code className="text-indigo-300">..0</code> + {directPurchases} direct)
          </p>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
            <Zap className="h-4 w-4" />
            <span>Recurring Renewals</span>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-2">
            {formatCurrency(renewalRevenue)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {renewalOrders} subsequent billing cycles (<code className="text-emerald-300">..1</code>, <code className="text-emerald-300">..2</code>, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}
