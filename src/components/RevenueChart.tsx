"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import { formatMonthName } from "@/lib/utils";
import { BarChart3, LineChart, TrendingUp } from "lucide-react";

interface MonthlyTrendData {
  month: string;
  gross: number;
  fees: number;
  taxes: number;
  refunds: number;
  net: number;
  chargesCount: number;
  momGross: number;
  momNet: number;
}

interface RevenueChartProps {
  data: MonthlyTrendData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [mounted, setMounted] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-80 w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-center text-slate-500">
        Loading chart...
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    monthName: formatMonthName(d.month),
    absFees: Math.abs(d.fees),
    absTaxes: Math.abs(d.taxes),
    absRefunds: Math.abs(d.refunds),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md text-xs space-y-2">
          <p className="font-bold text-white text-sm">{item.monthName} ({item.month})</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-6 text-indigo-300">
              <span>Gross Revenue:</span>
              <span className="font-mono font-semibold">{formatCurrency(item.gross)}</span>
            </div>
            <div className="flex justify-between gap-6 text-emerald-400">
              <span>Net Developer Payout:</span>
              <span className="font-mono font-semibold">{formatCurrency(item.net)}</span>
            </div>
            <div className="flex justify-between gap-6 text-rose-400">
              <span>Google Fee (15%):</span>
              <span className="font-mono font-semibold">-{formatCurrency(item.absFees)}</span>
            </div>
            <div className="flex justify-between gap-6 text-amber-400">
              <span>India TDS Tax:</span>
              <span className="font-mono font-semibold">-{formatCurrency(item.absTaxes)}</span>
            </div>
            {item.absRefunds > 0 && (
              <div className="flex justify-between gap-6 text-rose-300">
                <span>Refunds:</span>
                <span className="font-mono font-semibold">-{formatCurrency(item.absRefunds)}</span>
              </div>
            )}
            <div className="flex justify-between gap-6 text-slate-400 pt-1 border-t border-slate-800">
              <span>Paid Orders:</span>
              <span className="font-mono font-semibold text-white">{item.chargesCount}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Monthly Revenue & Payout Trends</h3>
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="h-3 w-3" />
              <span>MoM Tracking</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comparing Gross charges collected vs Net payouts received after Google 15% fee & India TDS withholdings
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => setChartType("bar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              chartType === "bar" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Bars</span>
          </button>
          <button
            onClick={() => setChartType("area")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              chartType === "area" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LineChart className="h-3.5 w-3.5" />
            <span>Area</span>
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
              />
              <Bar dataKey="gross" name="Gross Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" name="Net Developer Payout" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absFees" name="Google Fee (15%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
              />
              <Area
                type="monotone"
                dataKey="gross"
                name="Gross Revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#grossGrad)"
              />
              <Area
                type="monotone"
                dataKey="net"
                name="Net Developer Payout"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#netGrad)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

