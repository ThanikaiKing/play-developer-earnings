"use client";

import React from "react";
import { formatCurrency } from "@/lib/currency";
import { MapPin, Smartphone } from "lucide-react";

interface GeoItem {
  state: string;
  country: string;
  gross: number;
  count: number;
}

interface HardwareItem {
  hardware: string;
  count: number;
  gross: number;
}

interface GeoDeviceChartProps {
  geoData: GeoItem[];
  hardwareData: HardwareItem[];
}

export function GeoDeviceChart({ geoData, hardwareData }: GeoDeviceChartProps) {
  const maxGeoGross = Math.max(...(geoData || []).map((g) => g.gross), 1);
  const maxHwCount = Math.max(...(hardwareData || []).map((h) => h.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top States */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Geographic Revenue Distribution</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Top states and regions by customer gross spend</p>

        <div className="space-y-3">
          {(geoData || []).slice(0, 6).map((item) => {
            const barWidth = Math.max(3, (item.gross / maxGeoGross) * 100);
            return (
              <div key={item.state} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{item.state}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-white font-semibold">{formatCurrency(item.gross)}</span>
                    <span className="text-slate-400 text-[11px]">({item.count} orders)</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Hardware Devices */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="h-4 w-4 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Top Hardware Devices</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Most popular buyer smartphone models</p>

        <div className="space-y-3">
          {(hardwareData || []).slice(0, 6).map((item) => {
            const barWidth = Math.max(3, (item.count / maxHwCount) * 100);
            return (
              <div key={item.hardware} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-semibold">{item.hardware}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-indigo-400 font-semibold">{item.count} devices</span>
                    <span className="text-slate-400 text-[11px]">({formatCurrency(item.gross)})</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

