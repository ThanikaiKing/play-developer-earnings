"use client";

import React, { useEffect } from "react";
import {
  X,
  UserCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Smartphone,
  MapPin,
  CreditCard,
  Copy,
  Check,
  TrendingUp,
  Percent,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

interface PaymentTrailItem {
  id: string;
  orderId: string;
  transactionDate: string;
  transactionTime: string;
  transactionType: string;
  eventLabel: string;
  amount: number;
  serviceFeePercent: number;
  hardware: string;
  isRenewal: number;
  renewalCycle: number;
}

interface SubscriberData {
  baseOrderId: string;
  productTitle: string;
  skuId: string;
  basePlanId: string;
  offerId: string;
  buyerCountry: string;
  buyerState: string;
  hardware: string;
  chargesCount: number;
  renewalsCount: number;
  totalGross: number;
  totalNet: number;
  totalFees: number;
  firstPaymentDate: string;
  lastPaymentDate: string;
  nextRenewalDate: string;
  isTrialConversion: boolean;
  status: "active" | "expired" | "refunded";
  paymentTrail: PaymentTrailItem[];
}

interface SubscriberModalProps {
  subscriber: SubscriberData | null;
  onClose: () => void;
}

export function SubscriberModal({ subscriber, onClose }: SubscriberModalProps) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!subscriber) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(subscriber.baseOrderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isYearly = subscriber.basePlanId?.includes("year") || subscriber.skuId?.includes("year");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                subscriber.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : subscriber.status === "refunded"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {subscriber.status === "active" ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Active Subscriber</span>
                </>
              ) : subscriber.status === "refunded" ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Refunded</span>
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>Expired / Past Due</span>
                </>
              )}
            </span>

            {subscriber.isTrialConversion ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Converted from 3-day Trial</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700">
                <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                <span>Direct Purchase</span>
              </span>
            )}

            {isYearly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300 border border-purple-500/20">
                <span>Yearly Plan (365 Days)</span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
                {subscriber.baseOrderId}
              </h2>
              <button
                onClick={handleCopy}
                title="Copy Base Order ID"
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-sm text-slate-300 font-medium mt-1">{subscriber.productTitle}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{subscriber.buyerState}, {subscriber.buyerCountry}</span>
              </span>
              {subscriber.hardware && (
                <span className="flex items-center gap-1">
                  <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                  <span>Device: {subscriber.hardware}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>First paid: {formatDate(subscriber.firstPaymentDate)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4 KPI Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="rounded-2xl border border-indigo-900/40 bg-indigo-950/20 p-3.5">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Lifetime Value (LTV)
            </span>
            <p className="text-xl font-bold font-mono text-white mt-1">
              {formatCurrency(subscriber.totalGross)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-3.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              Net Payout (After Fee)
            </span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {formatCurrency(subscriber.totalNet)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Billings
            </span>
            <p className="text-xl font-bold font-mono text-white mt-1">
              {subscriber.chargesCount}{" "}
              <span className="text-xs font-normal text-slate-400 font-sans">
                ({subscriber.renewalsCount} renewals)
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Next Renewal / Expiry
            </span>
            <p className="text-base font-bold font-mono text-slate-200 mt-1 truncate">
              {formatDate(subscriber.nextRenewalDate)}
            </p>
          </div>
        </div>

        {/* Payment Trail Timeline */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Payment Trail & Billing Timeline</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {subscriber.paymentTrail.length} records recorded
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {subscriber.paymentTrail.map((item, idx) => {
              const isCharge = item.transactionType === "Charge";
              const isRefund = item.transactionType?.toLowerCase().includes("refund");
              const isFee = item.transactionType === "Google fee";

              let dotColor = "bg-slate-600";
              if (isCharge) {
                dotColor = item.eventLabel.includes("Trial") ? "bg-indigo-500" : "bg-emerald-500";
              } else if (isRefund) {
                dotColor = "bg-rose-500";
              } else if (isFee) {
                dotColor = "bg-rose-400/50";
              }

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div
                    className={`absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${dotColor} transition-transform group-hover:scale-125`}
                  />

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                              item.eventLabel.includes("Trial Conversion")
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                : item.eventLabel.includes("Renewal")
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : item.eventLabel.includes("Google Fee")
                                ? "bg-rose-500/10 text-rose-400"
                                : item.eventLabel.includes("Refund")
                                ? "bg-rose-600 text-white font-bold"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {item.eventLabel}
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {item.orderId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-sans">
                          {formatDate(item.transactionDate)} • {item.transactionTime}
                          {item.hardware && ` • Device: ${item.hardware}`}
                        </p>
                      </div>

                      <div className="text-right font-mono">
                        <span
                          className={`text-base font-bold ${
                            item.amount > 0
                              ? "text-emerald-400"
                              : item.amount < 0
                              ? "text-rose-400"
                              : "text-slate-400"
                          }`}
                        >
                          {formatCurrency(item.amount)}
                        </span>
                        {item.serviceFeePercent > 0 && (
                          <span className="block text-[11px] text-slate-400 font-sans">
                            Fee tier: {item.serviceFeePercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

