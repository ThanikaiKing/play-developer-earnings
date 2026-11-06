"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  Filter,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Tag,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

interface TransactionItem {
  id: string;
  order_id: string | null;
  is_renewal: number;
  renewal_cycle: number;
  transaction_date: string;
  transaction_time: string;
  tax_type: string | null;
  transaction_type: string;
  refund_type: string | null;
  product_title: string | null;
  sku_id: string | null;
  hardware: string | null;
  buyer_country: string | null;
  buyer_state: string | null;
  buyer_currency: string;
  amount_buyer_currency: number;
  merchant_currency: string;
  amount_merchant_currency: number;
  base_plan_id: string | null;
  service_fee_percent: number | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedSku, setSelectedSku] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [sortField, setSortField] = useState("transaction_date");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");

  // Options
  const [months, setMonths] = useState<string[]>([]);
  const [skus, setSkus] = useState<{ skuId: string; title: string }[]>([]);

  // Fetch filter options once
  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.availableMonths) setMonths(data.availableMonths);
        if (data.availableSkus) setSkus(data.availableSkus);
      })
      .catch(() => {});
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        month: selectedMonth,
        sku: selectedSku,
        type: selectedType,
        search,
        sortField,
        sortDir,
      });

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedMonth, selectedSku, selectedType, search, sortField, sortDir]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExportCsv = () => {
    const params = new URLSearchParams({
      month: selectedMonth,
      sku: selectedSku,
      type: selectedType,
      search,
      format: "csv",
    });
    window.location.href = `/api/transactions?${params.toString()}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Transactions Explorer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, search by GPA order ID, and filter all Google Play charges, fees, taxes, and refunds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition"
          >
            <Download className="h-4 w-4" />
            <span>Export Filtered CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Order ID, State..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 pl-10 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* SKU Filter */}
          <select
            value={selectedSku}
            onChange={(e) => {
              setSelectedSku(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All SKUs</option>
            {skus.map((s) => (
              <option key={s.skuId} value={s.skuId}>
                {s.title || s.skuId}
              </option>
            ))}
          </select>

          {/* Transaction Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Transaction Types</option>
            <option value="Charge">Charge (Customer Purchase)</option>
            <option value="Google fee">Google Fee (15%)</option>
            <option value="Tax">Tax (India TDS)</option>
            <option value="refund">Refunds</option>
          </select>
        </div>

        {/* Count summary and active filters */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <span>Showing {transactions.length} of {totalCount} records</span>
          </div>

          {(search || selectedMonth !== "all" || selectedSku !== "all" || selectedType !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedMonth("all");
                setSelectedSku("all");
                setSelectedType("all");
                setPage(1);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Product / SKU</th>
                <th className="py-3.5 px-4">Buyer Location</th>
                <th className="py-3.5 px-4">Device</th>
                <th className="py-3.5 px-4 text-right">Fee %</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                      <span>Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500 font-sans">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isNegative = tx.amount_merchant_currency < 0;
                  const isPositive = tx.amount_merchant_currency > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Order ID & Date */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          {tx.order_id ? (
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <span>{tx.order_id}</span>
                              {tx.is_renewal ? (
                                <span className="rounded bg-indigo-500/20 px-1 py-0.2 text-[10px] text-indigo-300 font-sans font-semibold">
                                  Renewal #{tx.renewal_cycle}
                                </span>
                              ) : (
                                <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[10px] text-emerald-300 font-sans font-semibold">
                                  Initial
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-400 font-sans font-medium">
                              {tx.tax_type || "Tax Deduction"}
                            </span>
                          )}
                          <span className="text-slate-400 text-[11px] font-sans">
                            {formatDate(tx.transaction_date)} • {tx.transaction_time}
                          </span>
                        </div>
                      </td>

                      {/* Transaction Type */}
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            tx.transaction_type === "Charge"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : tx.transaction_type === "Google fee"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : tx.transaction_type === "Tax"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>

                      {/* Product & SKU */}
                      <td className="py-3 px-4 font-sans max-w-[220px]">
                        <p className="truncate text-slate-200 font-medium" title={tx.product_title || ""}>
                          {tx.product_title || "—"}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400 truncate">
                          {tx.sku_id || tx.base_plan_id || "—"}
                        </p>
                      </td>

                      {/* Buyer Location */}
                      <td className="py-3 px-4 font-sans text-slate-300">
                        {tx.buyer_state ? (
                          <span>{tx.buyer_state}, {tx.buyer_country}</span>
                        ) : (
                          <span className="text-slate-500">{tx.buyer_country || "—"}</span>
                        )}
                      </td>

                      {/* Hardware */}
                      <td className="py-3 px-4 text-slate-400">
                        {tx.hardware || "—"}
                      </td>

                      {/* Fee % */}
                      <td className="py-3 px-4 text-right text-slate-400">
                        {tx.service_fee_percent ? `${tx.service_fee_percent}%` : "—"}
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3 px-4 text-right font-bold text-sm ${
                          isPositive
                            ? "text-emerald-400"
                            : isNegative
                            ? "text-rose-400"
                            : "text-slate-400"
                        }`}
                      >
                        {formatCurrency(tx.amount_merchant_currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-200"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Page <span className="text-white font-semibold">{page}</span> of{" "}
              <span className="text-white font-semibold">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

