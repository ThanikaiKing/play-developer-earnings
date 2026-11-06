"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatMonthName } from "@/lib/utils";

interface MonthReconciliation {
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

export default function ReconciliationPage() {
  const [data, setData] = useState<MonthReconciliation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((result) => {
        setData(result.monthlyTrends || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalGross = data.reduce((acc, m) => acc + m.gross, 0);
  const totalFees = data.reduce((acc, m) => acc + Math.abs(m.fees), 0);
  const totalTaxes = data.reduce((acc, m) => acc + Math.abs(m.taxes), 0);
  const totalRefunds = data.reduce((acc, m) => acc + Math.abs(m.refunds), 0);
  const totalNet = data.reduce((acc, m) => acc + m.net, 0);
  const totalOrders = data.reduce((acc, m) => acc + m.chargesCount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = [
      "Month",
      "Gross Sales (INR)",
      "Google Service Fee (INR)",
      "Refunds (INR)",
      "India Section 194-O TDS (INR)",
      "Net Developer Payout (INR)",
      "Paid Orders Count",
    ];

    const rows = data.map((d) => [
      d.month,
      d.gross.toFixed(2),
      (-Math.abs(d.fees)).toFixed(2),
      (-Math.abs(d.refunds)).toFixed(2),
      (-Math.abs(d.taxes)).toFixed(2),
      d.net.toFixed(2),
      d.chargesCount,
    ]);

    rows.push([
      "TOTAL",
      totalGross.toFixed(2),
      (-totalFees).toFixed(2),
      (-totalRefunds).toFixed(2),
      (-totalTaxes).toFixed(2),
      totalNet.toFixed(2),
      totalOrders,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `google_play_tax_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto print:bg-white print:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Tax & Payout Reconciliation
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              CA & Accounting Ready
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Reconcile Google Play Store 15% platform commissions, Section 194-O TDS withholdings, and net developer remittances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Sheet</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition"
          >
            <Download className="h-4 w-4" />
            <span>Export Statement CSV</span>
          </button>
        </div>
      </div>

      {/* Official Tax Summary Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm print:border-black print:bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base print:text-black">
                Google Play Commerce Developer Reconciliation
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                App ID: com.phoenixdev.tvkwarriors • Currency: INR (₹)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>Generated: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</span>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Cumulative Gross
            </span>
            <p className="text-xl font-bold font-mono text-indigo-300 mt-1 print:text-black">
              {formatCurrency(totalGross)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Google Commission (15%)
            </span>
            <p className="text-xl font-bold font-mono text-rose-400 mt-1 print:text-black">
              -{formatCurrency(totalFees)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Sec 194-O TDS Deducted
            </span>
            <p className="text-xl font-bold font-mono text-amber-400 mt-1 print:text-black">
              -{formatCurrency(totalTaxes)}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Total Net Deposited
            </span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1 print:text-black">
              {formatCurrency(totalNet)}
            </p>
          </div>
        </div>

        {/* Reconciliation Table */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider print:border-black">
              <tr>
                <th className="py-3 px-3">Billing Month</th>
                <th className="py-3 px-3 text-right">Gross Sales (₹)</th>
                <th className="py-3 px-3 text-right">Google Fee (15%)</th>
                <th className="py-3 px-3 text-right">Refunds & Fee Credit</th>
                <th className="py-3 px-3 text-right">India TDS (Sec 194-O)</th>
                <th className="py-3 px-3 text-right">Net Remittance (₹)</th>
                <th className="py-3 px-3 text-right">Paid Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono print:divide-black">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Calculating statement rows...
                  </td>
                </tr>
              ) : (
                data.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-sans font-semibold text-white print:text-black">
                      {formatMonthName(m.month)} ({m.month})
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-300 print:text-black">
                      {formatCurrency(m.gross)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-400 print:text-black">
                      -{formatCurrency(Math.abs(m.fees))}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 print:text-black">
                      {m.refunds !== 0 ? `-${formatCurrency(Math.abs(m.refunds))}` : "₹0.00"}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-400 print:text-black">
                      -{formatCurrency(Math.abs(m.taxes))}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400 print:text-black">
                      {formatCurrency(m.net)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 print:text-black">
                      {m.chargesCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Grand Totals Footer */}
            <tfoot className="border-t-2 border-slate-700 bg-slate-950/60 font-mono font-bold text-xs print:border-black print:bg-white">
              <tr>
                <td className="py-3.5 px-3 font-sans uppercase text-slate-300 print:text-black">
                  Total (All Months)
                </td>
                <td className="py-3.5 px-3 text-right text-indigo-300 print:text-black">
                  {formatCurrency(totalGross)}
                </td>
                <td className="py-3.5 px-3 text-right text-rose-400 print:text-black">
                  -{formatCurrency(totalFees)}
                </td>
                <td className="py-3.5 px-3 text-right text-slate-300 print:text-black">
                  -{formatCurrency(totalRefunds)}
                </td>
                <td className="py-3.5 px-3 text-right text-amber-400 print:text-black">
                  -{formatCurrency(totalTaxes)}
                </td>
                <td className="py-3.5 px-3 text-right text-emerald-400 print:text-black text-sm">
                  {formatCurrency(totalNet)}
                </td>
                <td className="py-3.5 px-3 text-right text-white print:text-black">
                  {totalOrders}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Note on Section 194-O TDS */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400 space-y-1 print:border-gray-300 print:text-black">
          <div className="flex items-center gap-1.5 font-bold text-slate-300 print:text-black">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Taxation & Statutory Notes:</span>
          </div>
          <p>
            • Under Section 194-O of the Indian Income Tax Act, Google as an e-commerce operator deducts TDS at 0.1% or applicable rate on gross e-commerce sales.
          </p>
          <p>
            • Platform service fees reflect Google's 15% tier under the Google Play developer tier program for the first USD 1M in eligible annual revenue.
          </p>
        </div>
      </div>
    </div>
  );
}

