"use client";

import React, { useState } from "react";
import { Lock, KeyRound, AlertCircle, Loader2 } from "lucide-react";

interface PinModalProps {
  onSuccess: () => void;
}

export function PinModal({ onSuccess }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Incorrect PIN. Please try again.");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Could not verify PIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Lock className="h-7 w-7" />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-xl font-bold tracking-tight text-white">Protected Analytics</h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your dashboard PIN to view Play Store developer revenue and financial analytics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                autoFocus
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 pl-11 text-center text-lg font-mono tracking-widest text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            </div>
            {error && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Unlock Dashboard</span>
          </button>
        </form>
      </div>
    </div>
  );
}

