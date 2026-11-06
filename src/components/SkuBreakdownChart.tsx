"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/currency";
import { Sparkles } from "lucide-react";

interface SkuItem {
  skuId: string;
  productTitle: string;
  gross: number;
  net: number;
  count: number;
  percent: number;
}

interface SkuBreakdownChartProps {
  data: SkuItem[];
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6"];

export function SkuBreakdownChart({ data }: SkuBreakdownChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !data || data.length === 0) {
    return (
      <div className="h-80 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-center text-slate-500">
        No SKU data available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
          <p className="font-bold text-white">{item.productTitle}</p>
          <p className="font-mono text-slate-400">SKU: {item.skuId}</p>
          <div className="flex justify-between gap-4 text-emerald-400 pt-1">
            <span>Gross Revenue:</span>
            <span className="font-mono font-semibold">{formatCurrency(item.gross)}</span>
          </div>
          <div className="flex justify-between gap-4 text-indigo-300">
            <span>Share:</span>
            <span className="font-mono font-semibold">{item.percent}% ({item.count} orders)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h3 className="text-base font-bold text-white">Product & SKU Performance</h3>
        </div>
        <p className="text-xs text-slate-400">Revenue and order share across subscriptions</p>

        {/* Donut Chart */}
        <div className="h-52 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="gross"
                nameKey="skuId"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown list */}
      <div className="space-y-3 mt-4 pt-4 border-t border-slate-800">
        {data.map((item, idx) => {
          const color = COLORS[idx % COLORS.length];
          return (
            <div key={item.skuId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate max-w-[65%]">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-medium text-slate-200 truncate" title={item.productTitle}>
                    {item.productTitle || item.skuId}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="text-white font-semibold">{formatCurrency(item.gross)}</span>
                  <span className="text-slate-400 text-[11px]">({item.percent}%)</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, item.percent)}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

