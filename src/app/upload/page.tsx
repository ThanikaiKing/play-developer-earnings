"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Database,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatMonthName } from "@/lib/utils";
import Link from "next/link";

interface BatchItem {
  id: string;
  filename: string;
  report_month: string;
  row_count: number;
  charges_count: number;
  gross_amount: number;
  google_fee_amount: number;
  taxes_amount: number;
  refunds_amount: number;
  net_amount: number;
  created_at: string;
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch("/api/batches");
      const data = await res.json();
      setBatches(data.batches || []);
    } catch {
      setError("Failed to load imported batches");
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setUploadResults([]);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadResults(data.results || []);
      await fetchBatches();
    } catch (err: any) {
      setError(err.message || "An error occurred during CSV parsing");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteBatch = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete batch "${name}"? This will delete all its transactions.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/batches?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchBatches();
      }
    } catch {
      alert("Failed to delete batch");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Data Management & CSV Ingestion
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload monthly Google Play Console earnings reports (<code className="text-indigo-400">PlayApps_YYYYMM.csv</code>).
          The ingestion engine handles idempotency, deduplication, and tax reconciliation automatically.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
          dragActive
            ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
            : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="csv-file-input"
        />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="text-lg font-bold text-white">
          Drag & drop your Google Play earnings CSVs here
        </h3>
        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
          Drop one or multiple monthly files (e.g. <span className="font-mono text-indigo-300">PlayApps_202610.csv</span>).
          Existing transactions will be safely deduplicated.
        </p>

        <div className="mt-6">
          <label
            htmlFor="csv-file-input"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing & Deduplicating...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                <span>Browse Files on Computer</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Results Feedback */}
      {uploadResults.length > 0 && (
        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ingestion Batch Complete</span>
          </div>
          <div className="space-y-2">
            {uploadResults.map((r, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-900/80 p-3 text-xs border border-slate-800"
              >
                <div>
                  <span className="font-bold text-white">{r.filename}</span>
                  {r.month && (
                    <span className="ml-2 font-mono text-indigo-400">({formatMonthName(r.month)})</span>
                  )}
                  {r.error && <p className="text-rose-400 mt-1">{r.error}</p>}
                </div>
                {r.success && (
                  <div className="flex items-center gap-4 font-mono text-slate-300">
                    <span className="text-emerald-400">+{r.insertedCount} new</span>
                    <span className="text-slate-500">{r.skippedCount} dupes skipped</span>
                    <span className="text-white font-bold">Net: {formatCurrency(r.netAmount)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              <span>View updated revenue on dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Imported Batches History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Imported Monthly Batches</h3>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {batches.length} files
            </span>
          </div>

          <button
            onClick={fetchBatches}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingBatches ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingBatches ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading imported batches...</div>
        ) : batches.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No reports imported yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Report Month</th>
                  <th className="py-3 px-3">Filename</th>
                  <th className="py-3 px-3 text-right">Rows</th>
                  <th className="py-3 px-3 text-right">Gross Sales</th>
                  <th className="py-3 px-3 text-right">Google Fee (15%)</th>
                  <th className="py-3 px-3 text-right">India TDS</th>
                  <th className="py-3 px-3 text-right">Net Payout</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-sans font-medium text-white">
                      {formatMonthName(b.report_month)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 truncate max-w-[180px]" title={b.filename}>
                      {b.filename}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">{b.row_count}</td>
                    <td className="py-3 px-3 text-right text-indigo-300">
                      {formatCurrency(b.gross_amount)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-400">
                      -{formatCurrency(Math.abs(b.google_fee_amount))}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-400">
                      -{formatCurrency(Math.abs(b.taxes_amount))}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      {formatCurrency(b.net_amount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDeleteBatch(b.id, b.filename)}
                        title="Delete this batch and its records"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

