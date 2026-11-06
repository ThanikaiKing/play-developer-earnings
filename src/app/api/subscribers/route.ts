import { NextRequest, NextResponse } from "next/server";
import { client, ensureTablesExist } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureTablesExist();
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const statusFilter = searchParams.get("status") || "all";
    const skuFilter = searchParams.get("sku") || "all";
    const subscriberId = searchParams.get("id"); // Single subscriber lookup for drilldown

    // Fetch all transactions with base_order_id
    let sql = `
      SELECT
        id,
        order_id,
        base_order_id,
        is_renewal,
        renewal_cycle,
        transaction_date,
        transaction_time,
        transaction_timestamp,
        transaction_type,
        refund_type,
        product_title,
        sku_id,
        base_plan_id,
        offer_id,
        hardware,
        buyer_country,
        buyer_state,
        amount_buyer_currency,
        buyer_currency,
        amount_merchant_currency,
        merchant_currency,
        service_fee_percent
      FROM transactions
      WHERE base_order_id IS NOT NULL AND base_order_id != ''
    `;
    const args: any[] = [];

    if (subscriberId) {
      sql += ` AND base_order_id = ?`;
      args.push(subscriberId);
    }

    sql += ` ORDER BY transaction_date ASC, transaction_time ASC`;

    const res = await client.execute({ sql, args });

    // Group transactions by base_order_id
    const subscriberMap = new Map<string, any>();

    // Determine latest transaction date in dataset to evaluate active status accurately
    let maxDateStr = "2026-09-29";
    for (const row of res.rows as any[]) {
      if (row.transaction_date > maxDateStr) {
        maxDateStr = row.transaction_date;
      }
    }
    const datasetLatestDate = new Date(maxDateStr);

    for (const row of res.rows as any[]) {
      const baseId = row.base_order_id;
      if (!subscriberMap.has(baseId)) {
        subscriberMap.set(baseId, {
          baseOrderId: baseId,
          productTitle: row.product_title || "Unknown",
          skuId: row.sku_id || "",
          basePlanId: row.base_plan_id || "",
          offerId: row.offer_id || "",
          buyerCountry: row.buyer_country || "IN",
          buyerState: row.buyer_state || "Unknown",
          hardware: row.hardware || "",
          chargesCount: 0,
          renewalsCount: 0,
          totalGross: 0,
          totalNet: 0,
          totalFees: 0,
          hasRefund: false,
          firstPaymentDate: row.transaction_date,
          lastPaymentDate: row.transaction_date,
          isTrialConversion: false,
          payments: [],
        });
      }

      const sub = subscriberMap.get(baseId);

      // Keep latest non-null metadata
      if (row.product_title) sub.productTitle = row.product_title;
      if (row.sku_id) sub.skuId = row.sku_id;
      if (row.base_plan_id) sub.basePlanId = row.base_plan_id;
      if (row.offer_id) sub.offerId = row.offer_id;
      if (row.buyer_state) sub.buyerState = row.buyer_state;
      if (row.hardware) sub.hardware = row.hardware;

      const amt = Number(row.amount_merchant_currency || 0);
      sub.totalNet += amt;

      if (row.transaction_type === "Charge") {
        sub.chargesCount += 1;
        sub.totalGross += amt;
        sub.lastPaymentDate = row.transaction_date;

        if (sub.chargesCount === 1) {
          sub.firstPaymentDate = row.transaction_date;
          if (row.order_id?.includes("..0") || row.offer_id?.includes("trial")) {
            sub.isTrialConversion = true;
          }
        } else {
          sub.renewalsCount += 1;
        }
      } else if (row.transaction_type === "Google fee") {
        sub.totalFees += amt;
      } else if (row.transaction_type?.toLowerCase().includes("refund")) {
        sub.hasRefund = true;
      }

      // Add to payment trail
      sub.payments.push({
        id: row.id,
        orderId: row.order_id,
        transactionDate: row.transaction_date,
        transactionTime: row.transaction_time,
        transactionType: row.transaction_type,
        refundType: row.refund_type,
        amount: amt,
        serviceFeePercent: row.service_fee_percent,
        hardware: row.hardware,
        isRenewal: row.is_renewal,
        renewalCycle: row.renewal_cycle,
      });
    }

    // Process status and format final list
    const subscribers: any[] = [];
    let activeCount = 0;
    let expiredCount = 0;
    let refundedCount = 0;
    let repeatCount = 0;
    let grandGross = 0;

    for (const sub of subscriberMap.values()) {
      grandGross += sub.totalGross;
      if (sub.chargesCount > 1) repeatCount += 1;

      // Calculate expiration date
      const lastDate = new Date(sub.lastPaymentDate);
      const plan = (sub.basePlanId || sub.skuId || "").toLowerCase();
      let durationDays = 32; // Default monthly
      if (plan.includes("year")) durationDays = 365;
      else if (plan.includes("quarter")) durationDays = 90;

      const expiryDate = new Date(lastDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const expiryDateStr = expiryDate.toISOString().slice(0, 10);

      let status = "active";
      if (sub.hasRefund) {
        status = "refunded";
        refundedCount += 1;
      } else if (expiryDate >= datasetLatestDate) {
        status = "active";
        activeCount += 1;
      } else {
        status = "expired";
        expiredCount += 1;
      }

      // Format payment trail event labels
      let chargeIndex = 0;
      const formattedTrail = sub.payments.map((p: any) => {
        let eventLabel = p.transactionType;
        if (p.transactionType === "Charge") {
          chargeIndex += 1;
          if (chargeIndex === 1) {
            eventLabel = p.orderId?.includes("..0")
              ? "Trial Conversion (1st Paid Charge)"
              : "Direct Purchase (1st Paid Charge)";
          } else {
            eventLabel = `Renewal #${chargeIndex - 1}`;
          }
        } else if (p.transactionType === "Google fee") {
          eventLabel = "Google Fee (15%)";
        } else if (p.transactionType?.toLowerCase().includes("refund")) {
          eventLabel = "Refund Issued";
        }

        return {
          ...p,
          eventLabel,
        };
      });

      subscribers.push({
        baseOrderId: sub.baseOrderId,
        productTitle: sub.productTitle,
        skuId: sub.skuId,
        basePlanId: sub.basePlanId,
        offerId: sub.offerId,
        buyerCountry: sub.buyerCountry,
        buyerState: sub.buyerState,
        hardware: sub.hardware,
        chargesCount: sub.chargesCount,
        renewalsCount: sub.renewalsCount,
        totalGross: Number(sub.totalGross.toFixed(2)),
        totalNet: Number(sub.totalNet.toFixed(2)),
        totalFees: Number(sub.totalFees.toFixed(2)),
        firstPaymentDate: sub.firstPaymentDate,
        lastPaymentDate: sub.lastPaymentDate,
        nextRenewalDate: expiryDateStr,
        isTrialConversion: sub.isTrialConversion,
        status,
        paymentTrail: formattedTrail,
      });
    }

    // Apply filters
    let filtered = subscribers;

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "repeat") {
        filtered = filtered.filter((s) => s.chargesCount > 1);
      } else {
        filtered = filtered.filter((s) => s.status === statusFilter);
      }
    }

    if (skuFilter && skuFilter !== "all") {
      if (skuFilter.includes(":")) {
        const [skuPart, planPart] = skuFilter.split(":");
        filtered = filtered.filter(
          (s) =>
            s.skuId === skuPart &&
            (planPart === "yearly"
              ? s.basePlanId === "yearly-plan" || s.basePlanId?.includes("year")
              : s.basePlanId === "monthly-plan" || s.basePlanId?.includes("month"))
        );
      } else {
        filtered = filtered.filter((s) => s.skuId === skuFilter);
      }
    }

    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.baseOrderId.toLowerCase().includes(search) ||
          s.productTitle.toLowerCase().includes(search) ||
          s.buyerState.toLowerCase().includes(search) ||
          s.hardware.toLowerCase().includes(search)
      );
    }

    // Sort by latest payment date descending, then total payments
    filtered.sort((a, b) => {
      if (b.lastPaymentDate !== a.lastPaymentDate) {
        return b.lastPaymentDate.localeCompare(a.lastPaymentDate);
      }
      return b.chargesCount - a.chargesCount;
    });

    const totalSubs = subscriberMap.size;
    const avgLtv = totalSubs > 0 ? grandGross / totalSubs : 0;

    // Fetch subscription retention & churn timeline if available
    const retentionRes = await client.execute(`
      SELECT 
        date,
        total_subscriptions AS totalSubscriptions,
        new_subscriptions AS newSubscriptions,
        canceled_subscriptions AS canceledSubscriptions,
        net_growth AS netGrowth
      FROM subscription_metrics
      ORDER BY date ASC
    `);

    return NextResponse.json({
      summary: {
        totalSubscribers: totalSubs,
        activeSubscribers: activeCount,
        expiredSubscribers: expiredCount,
        refundedSubscribers: refundedCount,
        repeatSubscribers: repeatCount,
        avgLtv: Number(avgLtv.toFixed(2)),
      },
      subscribers: filtered,
      retentionTimeline: retentionRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

