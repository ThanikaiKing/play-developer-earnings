"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Sparkles,
  CreditCard,
  ChevronRight,
  Loader2,
  RefreshCw,
  Wallet,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { MetricCard } from "@/components/MetricCard";
import { SubscriberModal } from "@/components/SubscriberModal";

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSku, setSelectedSku] = useState("all");
  const [selectedSubscriber, setSelectedSubscriber] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (selectedSku !== "all") params.set("sku", selectedSku);
      if (search) params.set("search", search);

      const res = await fetch(`/api/subscribers?${params.toString()}`);
      const data = await res.json();
      setSubscribers(data.subscribers || []);
      setSummary(data.summary || null);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedSku, search]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCount = summary?.activeSubscribers || 0;
  const totalCount = summary?.totalSubscribers || 0;
  const repeatCount = summary?.repeatSubscribers || 0;
  const avgLtv = summary?.avgLtv || 0;
  const retentionRate = totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Subscribers & Payment Trail
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              {activeCount} Currently Active
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Browse all paying Google Play customers, monitor active vs lapsed subscriptions, and drill down into their complete payment history and renewal trails.
          </p>
        </div>

        <button
          onClick={fetchSubscribers}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Subscribers"
          value={String(activeCount)}
          subtitle={`${retentionRate}% of all customers currently active`}
          icon={Users}
          variant="emerald"
          badge={`${activeCount} Active`}
          badgeType="positive"
        />
        <MetricCard
          title="Total Paying Customers"
          value={String(totalCount)}
          subtitle="Unique base subscription IDs"
          icon={CreditCard}
          variant="indigo"
          badge="117 Customers"
          badgeType="neutral"
        />
        <MetricCard
          title="Retained (2+ Payments)"
          value={String(repeatCount)}
          subtitle="Subscribers with renewals"
          icon={RotateCcw}
          variant="default"
          badge="Repeat Paying"
        />
        <MetricCard
          title="Average Customer LTV"
          value={formatCurrency(avgLtv)}
          subtitle="Average gross spend per subscriber"
          icon={TrendingUp}
          variant="emerald"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { key: "all", label: `All Subscribers (${totalCount})` },
          { key: "active", label: `🟢 Active (${activeCount})` },
          { key: "repeat", label: `🔄 Multi-Payment (${repeatCount})` },
          { key: "expired", label: `🟡 Expired (${summary?.expiredSubscribers || 0})` },
          { key: "refunded", label: `🔴 Refunded (${summary?.refundedSubscribers || 0})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              statusFilter === tab.key
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and SKU Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Subscriber ID (GPA...), product, state, device..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 pl-10 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedSku}
          onChange={(e) => setSelectedSku(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Subscription Products</option>
          <option value="tvk_ai_status_pro">TVK AI Status Pro</option>
          <option value="warrior_pro_monthly">Warrior Pro - Monthly</option>
          <option value="warrior_pro_quarterly">Warrior Pro - 3 Months</option>
          <option value="warrior_pro_yearly">Warrior Pro - 1 Year</option>
        </select>
      </div>

      {/* Subscribers Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Subscriber Base ID</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Product & Plan</th>
                <th className="py-3.5 px-4">Acquisition Mode</th>
                <th className="py-3.5 px-4">Billings & Renewals</th>
                <th className="py-3.5 px-4">Latest Payment</th>
                <th className="py-3.5 px-4 text-right">Lifetime Value (LTV)</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500 font-sans">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span>Loading subscribers & payment trails...</span>
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500 font-sans">
                    No subscribers found matching the filters.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => {
                  return (
                    <tr
                      key={sub.baseOrderId}
                      onClick={() => setSelectedSubscriber(sub)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Subscriber Base ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {sub.baseOrderId}
                          </span>
                          <button
                            onClick={(e) => handleCopy(sub.baseOrderId, e)}
                            title="Copy ID"
                            className="text-slate-500 hover:text-white"
                          >
                            {copiedId === sub.baseOrderId ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                          {sub.buyerState}, {sub.buyerCountry}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 font-sans">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            sub.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : sub.status === "refunded"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              sub.status === "active"
                                ? "bg-emerald-400 animate-pulse"
                                : sub.status === "refunded"
                                ? "bg-rose-400"
                                : "bg-amber-400"
                            }`}
                          />
                          <span>
                            {sub.status === "active"
                              ? "Active"
                              : sub.status === "refunded"
                              ? "Refunded"
                              : "Expired"}
                          </span>
                        </span>
                      </td>

                      {/* Product & Plan */}
                      <td className="py-3.5 px-4 font-sans max-w-[200px]">
                        <p className="truncate font-medium text-slate-200" title={sub.productTitle}>
                          {sub.productTitle}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400 truncate">
                          {sub.basePlanId || sub.skuId}
                        </p>
                      </td>

                      {/* Acquisition Mode */}
                      <td className="py-3.5 px-4 font-sans">
                        {sub.isTrialConversion ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-500/20">
                            <Sparkles className="h-3 w-3 text-amber-400" />
                            <span>Trial (..0)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                            <span>Direct</span>
                          </span>
                        )}
                      </td>

                      {/* Billings & Renewals */}
                      <td className="py-3.5 px-4 font-sans">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold font-mono ${
                            sub.renewalsCount > 0
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {sub.chargesCount} billings
                          {sub.renewalsCount > 0 && ` (${sub.renewalsCount} renewals)`}
                        </span>
                      </td>

                      {/* Latest Payment */}
                      <td className="py-3.5 px-4 font-sans text-slate-300">
                        <span>{formatDate(sub.lastPaymentDate)}</span>
                      </td>

                      {/* Lifetime Value (LTV) */}
                      <td className="py-3.5 px-4 text-right font-bold text-sm text-emerald-400">
                        {formatCurrency(sub.totalGross)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center font-sans">
                        <button
                          onClick={() => setSelectedSubscriber(sub)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition"
                        >
                          <span>Trail</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill Down Modal */}
      <SubscriberModal
        subscriber={selectedSubscriber}
        onClose={() => setSelectedSubscriber(null)}
      />
    </div>
  );
}

