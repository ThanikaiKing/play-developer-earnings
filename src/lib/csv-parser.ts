import Papa from "papaparse";
import crypto from "crypto";
import { NewTransaction, NewImportBatch } from "../db/schema";

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  january: "01", february: "02", march: "03", april: "04",
  june: "06", july: "07", august: "08", september: "09",
  october: "10", november: "11", december: "12",
};

/**
 * Normalizes a date like "Feb 28, 2026" or "2026-02-28" to "YYYY-MM-DD"
 */
export function normalizeDate(dateStr: string): { normalized: string; yearMonth: string } {
  if (!dateStr) {
    const now = new Date().toISOString().slice(0, 10);
    return { normalized: now, yearMonth: now.slice(0, 7) };
  }

  const trimmed = dateStr.trim();
  // Check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { normalized: trimmed, yearMonth: trimmed.slice(0, 7) };
  }

  // Parse "Feb 28, 2026" or "February 28, 2026"
  const match = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (match) {
    const monthKey = match[1].toLowerCase();
    const mm = MONTH_MAP[monthKey] || "01";
    const dd = match[2].padStart(2, "0");
    const yyyy = match[3];
    const normalized = `${yyyy}-${mm}-${dd}`;
    return { normalized, yearMonth: `${yyyy}-${mm}` };
  }

  // Fallback to JS Date parser
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return { normalized: `${yyyy}-${mm}-${dd}`, yearMonth: `${yyyy}-${mm}` };
  }

  const today = new Date().toISOString().slice(0, 10);
  return { normalized: today, yearMonth: today.slice(0, 7) };
}

/**
 * Parses time like "10:33:00 AM PST" or "9:03:59 AM PDT" into ISO timestamp
 */
export function parseTimestamp(dateStr: string, timeStr: string): string {
  try {
    const { normalized } = normalizeDate(dateStr);
    const cleanTime = (timeStr || "12:00:00 PM").trim();
    // Parse time and timezone offset
    let tzOffset = "+00:00";
    if (cleanTime.includes("PST")) tzOffset = "-08:00";
    else if (cleanTime.includes("PDT")) tzOffset = "-07:00";
    else if (cleanTime.includes("IST")) tzOffset = "+05:30";
    else if (cleanTime.includes("UTC") || cleanTime.includes("GMT")) tzOffset = "Z";

    const timeOnly = cleanTime.replace(/\s*(PST|PDT|IST|UTC|GMT)\s*$/i, "").trim();
    const timeMatch = timeOnly.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      const seconds = timeMatch[3] || "00";
      const ampm = timeMatch[4]?.toUpperCase();

      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;

      const hh = String(hours).padStart(2, "0");
      if (tzOffset === "Z") {
        return `${normalized}T${hh}:${minutes}:${seconds}.000Z`;
      }
      return `${normalized}T${hh}:${minutes}:${seconds}${tzOffset}`;
    }
    return `${normalized}T00:00:00Z`;
  } catch {
    return new Date().toISOString();
  }
}

export interface ParsedCsvResult {
  batch: {
    id: string;
    filename: string;
    reportMonth: string;
    rowCount: number;
    chargesCount: number;
    grossAmount: number;
    googleFeeAmount: number;
    taxesAmount: number;
    refundsAmount: number;
    netAmount: number;
    createdAt: string;
  };
  transactions: NewTransaction[];
  duplicateCount: number;
}

export function parseGooglePlayCsv(
  csvContent: string,
  filename: string,
  batchId?: string
): ParsedCsvResult {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (!parsed.data || parsed.data.length === 0) {
    throw new Error(`CSV file ${filename} contains no rows or invalid format.`);
  }

  const fields = (parsed.meta.fields || []).map((f) => f.trim());
  const hasTxType = fields.includes("Transaction Type");
  const hasMerchantAmount = fields.includes("Amount (Merchant Currency)");
  const hasTxDate = fields.includes("Transaction Date");

  if (!hasTxType || !hasMerchantAmount || !hasTxDate) {
    throw new Error(
      `File ${filename} is not a valid Google Play Earnings report (missing required columns: Transaction Type, Amount (Merchant Currency), Transaction Date).`
    );
  }

  // Pre-determine report month from rows and filename
  let dominantMonth = new Date().toISOString().slice(0, 7);
  const fnMatch = filename.match(/(\d{4})(\d{2})/);
  if (fnMatch) {
    dominantMonth = `${fnMatch[1]}-${fnMatch[2]}`;
  }

  // Deterministic batch ID based on filename and report month
  const actualBatchId =
    batchId || crypto.createHash("md5").update(`${filename}_${dominantMonth}`).digest("hex");

  const txList: NewTransaction[] = [];
  const monthCounts: Record<string, number> = {};

  let gross = 0;
  let fees = 0;
  let taxes = 0;
  let refunds = 0;
  let net = 0;
  let chargesCount = 0;

  for (const row of parsed.data) {
    const rawOrder = (row["Description"] || "").trim();
    const dateRaw = row["Transaction Date"] || "";
    const timeRaw = row["Transaction Time"] || "";
    const txType = (row["Transaction Type"] || "").trim();
    const taxType = (row["Tax Type"] || "").trim();
    const skuId = (row["Sku Id"] || "").trim();
    const merchantAmount = parseFloat(row["Amount (Merchant Currency)"] || "0") || 0;
    const buyerAmount = parseFloat(row["Amount (Buyer Currency)"] || "0") || 0;
    const convRate = parseFloat(row["Currency Conversion Rate"] || "1") || 1;
    const serviceFeePercent = parseFloat(row["Service Fee %"] || "0") || 0;

    const { normalized: txDate, yearMonth } = normalizeDate(dateRaw);
    monthCounts[yearMonth] = (monthCounts[yearMonth] || 0) + 1;

    // Detect renewal status
    let isRenewal = 0;
    let renewalCycle = 0;
    if (rawOrder.includes("..")) {
      isRenewal = 1;
      const parts = rawOrder.split("..");
      const cycleNum = parseInt(parts[1], 10);
      renewalCycle = isNaN(cycleNum) ? 1 : cycleNum + 1;
    }

    const hardware = (row["Hardware"] || "").trim();

    // Deterministic hash ID for 100% idempotent deduplication
    const hashSignature = `${rawOrder}|${txDate}|${timeRaw}|${txType}|${taxType}|${skuId}|${merchantAmount.toFixed(2)}|${hardware}`;
    const id = crypto.createHash("sha256").update(hashSignature).digest("hex");

    const isoTimestamp = parseTimestamp(dateRaw, timeRaw);

    const tx: NewTransaction = {
      id,
      batchId: actualBatchId,
      orderId: rawOrder || null,
      isRenewal,
      renewalCycle,
      transactionDate: txDate,
      transactionTime: timeRaw,
      transactionTimestamp: isoTimestamp,
      taxType: taxType || null,
      transactionType: txType,
      refundType: (row["Refund Type"] || "").trim() || null,
      productTitle: (row["Product Title"] || "").trim() || null,
      packageId: (row["Package ID"] || "").trim() || null,
      productType: (row["Product Type"] || "").trim() || null,
      skuId: skuId || null,
      hardware: hardware || null,
      buyerCountry: (row["Buyer Country"] || "").trim() || null,
      buyerState: (row["Buyer State"] || "").trim() || null,
      buyerPostalCode: (row["Buyer Postal Code"] || "").trim() || null,
      buyerCurrency: (row["Buyer Currency"] || "").trim() || "INR",
      amountBuyerCurrency: buyerAmount,
      currencyConversionRate: convRate,
      merchantCurrency: (row["Merchant Currency"] || "").trim() || "INR",
      amountMerchantCurrency: merchantAmount,
      basePlanId: (row["Base Plan or Purchase Option ID"] || "").trim() || null,
      offerId: (row["Offer ID"] || "").trim() || null,
      groupId: (row["Group ID"] || "").trim() || null,
      firstUsd1mEligible: (row["First USD 1M Eligible"] || "").trim() || null,
      serviceFeePercent,
      feeDescription: (row["Fee Description"] || "").trim() || null,
      promotionId: (row["Promotion ID"] || "").trim() || null,
      salesChannel: (row["Sales Channel"] || "").trim() || null,
    };

    txList.push(tx);

    net += merchantAmount;
    if (txType === "Charge") {
      gross += merchantAmount;
      chargesCount += 1;
    } else if (txType === "Google fee") {
      fees += merchantAmount;
    } else if (txType === "Tax") {
      taxes += merchantAmount;
    } else if (txType.toLowerCase().includes("refund")) {
      refunds += merchantAmount;
    }
  }

  // Update dominant month if row counts show another month
  const mostCommonRowMonth = Object.keys(monthCounts).sort(
    (a, b) => (monthCounts[b] || 0) - (monthCounts[a] || 0)
  )[0];
  if (mostCommonRowMonth && !filename.match(/(\d{4})(\d{2})/)) {
    dominantMonth = mostCommonRowMonth;
  }

  const batch: ParsedCsvResult["batch"] = {
    id: actualBatchId,
    filename,
    reportMonth: dominantMonth,
    rowCount: txList.length,
    chargesCount,
    grossAmount: parseFloat(gross.toFixed(2)),
    googleFeeAmount: parseFloat(fees.toFixed(2)),
    taxesAmount: parseFloat(taxes.toFixed(2)),
    refundsAmount: parseFloat(refunds.toFixed(2)),
    netAmount: parseFloat(net.toFixed(2)),
    createdAt: new Date().toISOString(),
  };

  return {
    batch,
    transactions: txList,
    duplicateCount: 0,
  };
}
