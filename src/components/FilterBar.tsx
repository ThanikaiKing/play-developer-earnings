"use client";

import React from "react";
import { formatMonthName } from "@/lib/utils";
import { Filter, Calendar, Tag } from "lucide-react";

interface FilterBarProps {
  months: string[];
  skus: { skuId: string; title: string }[];
  selectedMonth: string;
  selectedSku: string;
  onMonthChange: (month: string) => void;
  onSkuChange: (sku: string) => void;
}

export function FilterBar({
  months,
  skus,
  selectedMonth,
  selectedSku,
  onMonthChange,
  onSkuChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 backdrop-blur-sm">
      {/* Month pill selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 px-2 shrink-0">
          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
          <span>Period:</span>
        </div>
        <button
          onClick={() => onMonthChange("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition ${
            selectedMonth === "all"
              ? "bg-indigo-600 text-white shadow"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          All Months
        </button>
        {months.map((m) => (
          <button
            key={m}
            onClick={() => onMonthChange(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition ${
              selectedMonth === m
                ? "bg-indigo-600 text-white shadow"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {formatMonthName(m)}
          </button>
        ))}
      </div>

      {/* SKU selector */}
      <div className="flex items-center gap-2 shrink-0">
        <Tag className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <select
          value={selectedSku}
          onChange={(e) => onSkuChange(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Products / SKUs</option>
          {skus.map((s) => (
            <option key={s.skuId} value={s.skuId}>
              {s.title || s.skuId}
            </option>
          ))}
        </select>

        {(selectedMonth !== "all" || selectedSku !== "all") && (
          <button
            onClick={() => {
              onMonthChange("all");
              onSkuChange("all");
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 px-2 py-1"
          >
            <Filter className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

