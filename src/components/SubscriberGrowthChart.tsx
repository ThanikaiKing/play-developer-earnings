"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatDate } from "@/lib/utils";
import { TrendingUp, UserMinus, UserPlus, Users, ChevronDown, ChevronUp } from "lucide-react";

interface RetentionPoint {
  date: string;
  totalSubscriptions: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  netGrowth: number;
}

interface SubscriberGrowthChartProps {
  data: RetentionPoint[];
}

export function SubscriberGrowthChart({ data }: SubscriberGrowthChartProps) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"growth" | "churn">("growth");
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !data || data.length === 0) return null;

  // Downsample to weekly or every 3rd point if large dataset for smooth rendering
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: d.date.slice(5), // MM-DD
    fullDate: formatDate(d.date),
  }));

  const latestPoint = data[data.length - 1];
  const totalNew = data.reduce((acc, d) => acc + (d.newSubscriptions || 0), 0);
  const totalCanceled = data.reduce((acc, d) => acc + (d.canceledSubscriptions || 0), 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md text-xs space-y-2">
          <p className="font-bold text-white text-sm">{item.fullDate}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-6 text-emerald-400 font-mono">
              <span>Active Subscriptions:</span>
              <span className="font-bold">{item.totalSubscriptions}</span>
            </div>
            <div className="flex justify-between gap-6 text-indigo-300 font-mono">
              <span>New Signups:</span>
              <span className="font-bold">+{item.newSubscriptions}</span>
            </div>
            <div className="flex justify-between gap-6 text-rose-400 font-mono">
              <span>Cancellations:</span>
              <span className="font-bold">-{item.canceledSubscriptions}</span>
            </div>
            <div className="flex justify-between gap-6 text-slate-300 font-mono pt-1 border-t border-slate-800">
              <span>Net Change:</span>
              <span className={item.netGrowth >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {item.netGrowth > 0 ? `+${item.netGrowth}` : item.netGrowth}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Subscriber Growth & Churn Trend</h3>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                Google Play Status Report
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily active subscriber trajectory, new conversions, and cancellation velocity ({data[0].date} to {latestPoint.date})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              onClick={() => setView("growth")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                view === "growth" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span>Active Curve</span>
            </button>
            <button
              onClick={() => setView("churn")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                view === "churn" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserMinus className="h-3.5 w-3.5 text-rose-400" />
              <span>New vs Churn</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 my-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[11px] font-sans">Current Active</span>
              <span className="text-lg font-bold text-emerald-400">{latestPoint.totalSubscriptions} subscribers</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-sans">Total New Added</span>
              <span className="text-lg font-bold text-indigo-300">+{totalNew} signups</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-sans">Total Cancellations</span>
              <span className="text-lg font-bold text-rose-400">-{totalCanceled} churned</span>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {view === "growth" ? (
                <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activeSubsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalSubscriptions"
                    name="Active Subscriptions"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#activeSubsGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                    formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
                  />
                  <Bar dataKey="newSubscriptions" name="New Subscriptions" fill="#6366f1" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="canceledSubscriptions" name="Cancellations (Churn)" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
