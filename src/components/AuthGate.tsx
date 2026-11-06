"use client";

import React, { useEffect, useState } from "react";
import { PinModal } from "./PinModal";
import { Loader2 } from "lucide-react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [requiresPin, setRequiresPin] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      setRequiresPin(data.required || false);
      setAuthenticated(data.authenticated ?? true);
    } catch {
      setAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm font-medium">Loading Play Store Analytics...</p>
        </div>
      </div>
    );
  }

  if (requiresPin && !authenticated) {
    return <PinModal onSuccess={() => setAuthenticated(true)} />;
  }

  return <>{children}</>;
}

