"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-400 max-w-sm">
        {error.message || "An unexpected error occurred while rendering the dashboard."}
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
      >
        <RefreshCw className="h-4 w-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
}

