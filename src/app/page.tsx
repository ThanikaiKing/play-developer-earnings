"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Percent,
  Receipt,
  RotateCcw,
  ShoppingCart,
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { RevenueChart } from "@/components/RevenueChart";
import { SkuBreakdownChart } from "@/components/SkuBreakdownChart";
import { RenewalRatioChart } from "@/components/RenewalRatioChart";
import { GeoDeviceChart } from "@/components/GeoDeviceChart";
import { FilterBar } from "@/components/FilterBar";
import { formatCurrency } from "@/lib/currency";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedSku, setSelectedSku] = useState("all");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedMonth !== "all") params.set("month", selectedMonth);
      if (selectedSku !== "all") params.set("sku", selectedSku);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedSku]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const kpis = data?.kpis || {
    gross: 0,
    googleFees: 0,
    taxes: 0,
    refunds: 0,
    net: 0,
    totalCharges: 0,
    aov: 0,
    initialOrders: 0,
    initialRevenue: 0,
    renewalOrders: 0,
    renewalRevenue: 0,
    renewalShare: 0,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Developer Revenue Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Google Play Console earnings, commission deductions, India TDS taxes, and subscription renewals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload New CSV</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      {data && (
        <FilterBar
          months={data.availableMonths || []}
          skus={data.availableSkus || []}
          selectedMonth={selectedMonth}
          selectedSku={selectedSku}
          onMonthChange={setSelectedMonth}
          onSkuChange={setSelectedSku}
        />
      )}

      {loading && !data ? (
        <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-sm">Calculating Play Store Financial Analytics...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-6 text-center text-rose-400">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Net Developer Payout"
              value={formatCurrency(kpis.net)}
              subtitle="Deposited into developer bank account"
              icon={Wallet}
              variant="emerald"
              badge="Net Earnings"
              badgeType="positive"
            />
            <MetricCard
              title="Gross Customer Spend"
              value={formatCurrency(kpis.gross)}
              subtitle={`${kpis.totalCharges} customer purchases`}
              icon={TrendingUp}
              variant="indigo"
              badge="Topline"
              badgeType="neutral"
            />
            <MetricCard
              title="Google Platform Fee (15%)"
              value={`-${formatCurrency(Math.abs(kpis.googleFees))}`}
              subtitle="Google Play 15% tier commission"
              icon={Percent}
              variant="rose"
              badge="15% Fee"
              badgeType="negative"
            />
            <MetricCard
              title="India TDS Withheld"
              value={`-${formatCurrency(Math.abs(kpis.taxes))}`}
              subtitle="Sec 194-O tax deducted at source"
              icon={Receipt}
              variant="amber"
              badge="Sec 194-O"
              badgeType="neutral"
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Average Order Value (AOV)"
              value={formatCurrency(kpis.aov)}
              subtitle="Average revenue per paid charge"
              icon={ShoppingCart}
              variant="default"
            />
            <MetricCard
              title="Recurring Renewal Share"
              value={`${kpis.renewalShare.toFixed(1)}%`}
              subtitle={`${kpis.renewalOrders} recurring billing renewals`}
              icon={RotateCcw}
              variant="indigo"
            />
            <MetricCard
              title="Total Refunds Clawed Back"
              value={formatCurrency(kpis.refunds)}
              subtitle="Net refunds after fee credit"
              icon={Receipt}
              variant={kpis.refunds < 0 ? "rose" : "default"}
            />
          </div>

          {/* Charts Row: Monthly Trend (2/3) & SKU Breakdown (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart data={data?.monthlyTrends || []} />
            </div>
            <div className="lg:col-span-1">
              <SkuBreakdownChart data={data?.skuBreakdown || []} />
            </div>
          </div>

          {/* Subscription Renewal Cohort Ratio */}
          <RenewalRatioChart
            initialOrders={kpis.initialOrders}
            initialRevenue={kpis.initialRevenue}
            renewalOrders={kpis.renewalOrders}
            renewalRevenue={kpis.renewalRevenue}
            renewalShare={kpis.renewalShare}
          />

          {/* Geographic & Hardware Distribution */}
          <GeoDeviceChart
            geoData={data?.geoBreakdown || []}
            hardwareData={data?.hardwareBreakdown || []}
          />

          {/* Quick Action Banner */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Need Detailed Accounting or Raw Records?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Explore individual GPA orders with search filters, or view the tax reconciliation sheet for CA tax filing.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/transactions"
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
              >
                <Receipt className="h-4 w-4" />
                <span>Browse Transactions</span>
              </Link>
              <Link
                href="/reconciliation"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Tax Statement</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

