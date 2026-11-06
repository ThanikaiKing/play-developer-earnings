import { NextRequest, NextResponse } from "next/server";
import { client, ensureTablesExist } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureTablesExist();
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get("month") || "all";
    const selectedSku = searchParams.get("sku") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build filter SQL conditions
    const whereClauses: string[] = ["1=1"];
    const whereArgs: any[] = [];

    if (selectedMonth && selectedMonth !== "all") {
      whereClauses.push("substr(transaction_date, 1, 7) = ?");
      whereArgs.push(selectedMonth);
    }

    if (selectedSku && selectedSku !== "all") {
      if (selectedSku.includes(":")) {
        const [sku, plan] = selectedSku.split(":");
        whereClauses.push("sku_id = ? AND base_plan_id = ?");
        whereArgs.push(sku, plan === "yearly" ? "yearly-plan" : "monthly-plan");
      } else {
        whereClauses.push("sku_id = ?");
        whereArgs.push(selectedSku);
      }
    }

    if (startDate) {
      whereClauses.push("transaction_date >= ?");
      whereArgs.push(startDate);
    }

    if (endDate) {
      whereClauses.push("transaction_date <= ?");
      whereArgs.push(endDate);
    }

    const whereSql = whereClauses.join(" AND ");

    // 1. Overall KPIs
    const kpiRes = await client.execute({
      sql: `
        SELECT
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN amount_merchant_currency ELSE 0 END), 0) AS gross_revenue,
          COALESCE(SUM(CASE WHEN transaction_type = 'Google fee' THEN amount_merchant_currency ELSE 0 END), 0) AS google_fees,
          COALESCE(SUM(CASE WHEN transaction_type = 'Tax' THEN amount_merchant_currency ELSE 0 END), 0) AS taxes_withheld,
          COALESCE(SUM(CASE WHEN transaction_type LIKE '%refund%' THEN amount_merchant_currency ELSE 0 END), 0) AS refunds_total,
          COALESCE(SUM(amount_merchant_currency), 0) AS net_revenue,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN 1 ELSE 0 END), 0) AS total_charges,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' AND is_renewal = 0 THEN 1 ELSE 0 END), 0) AS initial_orders,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' AND is_renewal = 0 THEN amount_merchant_currency ELSE 0 END), 0) AS initial_revenue,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' AND order_id LIKE '%..0%' THEN 1 ELSE 0 END), 0) AS trial_conversions,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' AND order_id NOT LIKE '%..%' THEN 1 ELSE 0 END), 0) AS direct_purchases,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' AND is_renewal = 1 THEN 1 ELSE 0 END), 0) AS renewal_orders,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' AND is_renewal = 1 THEN amount_merchant_currency ELSE 0 END), 0) AS renewal_revenue,
          COUNT(*) AS total_rows
        FROM transactions
        WHERE ${whereSql}
      `,
      args: whereArgs,
    });

    const kpiRow = kpiRes.rows[0] as any;
    const gross = Number(kpiRow.gross_revenue || 0);
    const googleFees = Number(kpiRow.google_fees || 0);
    const taxes = Number(kpiRow.taxes_withheld || 0);
    const refunds = Number(kpiRow.refunds_total || 0);
    const net = Number(kpiRow.net_revenue || 0);
    const totalCharges = Number(kpiRow.total_charges || 0);
    const initialOrders = Number(kpiRow.initial_orders || 0);
    const initialRevenue = Number(kpiRow.initial_revenue || 0);
    const trialConversions = Number(kpiRow.trial_conversions || 0);
    const directPurchases = Number(kpiRow.direct_purchases || 0);
    const renewalOrders = Number(kpiRow.renewal_orders || 0);
    const renewalRevenue = Number(kpiRow.renewal_revenue || 0);
    const aov = totalCharges > 0 ? gross / totalCharges : 0;
    const renewalShare = gross > 0 ? (renewalRevenue / gross) * 100 : 0;

    // 2. Monthly Trend breakdown
    const monthlyRes = await client.execute({
      sql: `
        SELECT
          substr(transaction_date, 1, 7) AS month,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN amount_merchant_currency ELSE 0 END), 0) AS gross,
          COALESCE(SUM(CASE WHEN transaction_type = 'Google fee' THEN amount_merchant_currency ELSE 0 END), 0) AS fees,
          COALESCE(SUM(CASE WHEN transaction_type = 'Tax' THEN amount_merchant_currency ELSE 0 END), 0) AS taxes,
          COALESCE(SUM(CASE WHEN transaction_type LIKE '%refund%' THEN amount_merchant_currency ELSE 0 END), 0) AS refunds,
          COALESCE(SUM(amount_merchant_currency), 0) AS net,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN 1 ELSE 0 END), 0) AS charges_count
        FROM transactions
        WHERE ${whereSql}
        GROUP BY substr(transaction_date, 1, 7)
        ORDER BY month ASC
      `,
      args: whereArgs,
    });

    const monthlyTrends = monthlyRes.rows.map((row: any, idx, arr) => {
      const currentGross = Number(row.gross || 0);
      const currentNet = Number(row.net || 0);
      let momGross = 0;
      let momNet = 0;

      if (idx > 0) {
        const prevGross = Number(arr[idx - 1].gross || 0);
        const prevNet = Number(arr[idx - 1].net || 0);
        if (prevGross > 0) momGross = ((currentGross - prevGross) / prevGross) * 100;
        if (prevNet > 0) momNet = ((currentNet - prevNet) / prevNet) * 100;
      }

      return {
        month: row.month,
        gross: Number(currentGross.toFixed(2)),
        fees: Number(Number(row.fees || 0).toFixed(2)),
        taxes: Number(Number(row.taxes || 0).toFixed(2)),
        refunds: Number(Number(row.refunds || 0).toFixed(2)),
        net: Number(currentNet.toFixed(2)),
        chargesCount: Number(row.charges_count || 0),
        momGross: Number(momGross.toFixed(1)),
        momNet: Number(momNet.toFixed(1)),
      };
    });

    // 3. SKU Breakdown (splitting TVK AI Status Pro into Yearly ₹599 and Monthly ₹99)
    const skuRes = await client.execute({
      sql: `
        SELECT
          CASE 
            WHEN sku_id = 'tvk_ai_status_pro' AND (base_plan_id = 'yearly-plan' OR base_plan_id LIKE '%year%') THEN 'tvk_ai_status_pro:yearly'
            WHEN sku_id = 'tvk_ai_status_pro' AND (base_plan_id = 'monthly-plan' OR base_plan_id LIKE '%month%') THEN 'tvk_ai_status_pro:monthly'
            ELSE sku_id 
          END AS item_key,
          sku_id,
          base_plan_id,
          CASE
            WHEN sku_id = 'tvk_ai_status_pro' AND (base_plan_id = 'yearly-plan' OR base_plan_id LIKE '%year%') THEN 'TVK AI Status Pro - Yearly (₹599)'
            WHEN sku_id = 'tvk_ai_status_pro' AND (base_plan_id = 'monthly-plan' OR base_plan_id LIKE '%month%') THEN 'TVK AI Status Pro - Monthly (₹99)'
            WHEN sku_id = 'warrior_pro_monthly' THEN 'Warrior Pro - Monthly (₹49)'
            WHEN sku_id = 'warrior_pro_yearly' THEN 'Warrior Pro - 1 Year (₹299)'
            WHEN sku_id = 'warrior_pro_quarterly' THEN 'Warrior Pro - 3 Months (₹99)'
            ELSE MAX(product_title)
          END AS display_title,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN amount_merchant_currency ELSE 0 END), 0) AS gross,
          COALESCE(SUM(amount_merchant_currency), 0) AS net,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN 1 ELSE 0 END), 0) AS count
        FROM transactions
        WHERE ${whereSql} AND sku_id IS NOT NULL AND sku_id != ''
        GROUP BY item_key
        ORDER BY gross DESC
      `,
      args: whereArgs,
    });

    const skuBreakdown = skuRes.rows.map((row: any) => {
      const g = Number(row.gross || 0);
      return {
        skuId: row.item_key,
        baseSkuId: row.sku_id,
        basePlanId: row.base_plan_id,
        productTitle: row.display_title || row.sku_id,
        gross: Number(g.toFixed(2)),
        net: Number(Number(row.net || 0).toFixed(2)),
        count: Number(row.count || 0),
        percent: gross > 0 ? Number(((g / gross) * 100).toFixed(1)) : 0,
      };
    });

    // 4. Base Plan Breakdown
    const planRes = await client.execute({
      sql: `
        SELECT
          COALESCE(base_plan_id, sku_id) AS base_plan,
          sku_id,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN amount_merchant_currency ELSE 0 END), 0) AS gross,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN 1 ELSE 0 END), 0) AS count
        FROM transactions
        WHERE ${whereSql} AND base_plan_id IS NOT NULL AND base_plan_id != ''
        GROUP BY base_plan_id, sku_id
        ORDER BY gross DESC
      `,
      args: whereArgs,
    });

    const planBreakdown = planRes.rows.map((row: any) => ({
      basePlan: row.base_plan,
      skuId: row.sku_id,
      gross: Number(Number(row.gross || 0).toFixed(2)),
      count: Number(row.count || 0),
    }));

    // 5. Geographic (State) Breakdown
    const geoRes = await client.execute({
      sql: `
        SELECT
          COALESCE(buyer_state, 'Unknown / Not Provided') AS state,
          COALESCE(buyer_country, 'IN') AS country,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN amount_merchant_currency ELSE 0 END), 0) AS gross,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN 1 ELSE 0 END), 0) AS count
        FROM transactions
        WHERE ${whereSql} AND buyer_state IS NOT NULL AND buyer_state != ''
        GROUP BY buyer_state
        ORDER BY gross DESC
        LIMIT 10
      `,
      args: whereArgs,
    });

    const geoBreakdown = geoRes.rows.map((row: any) => ({
      state: row.state,
      country: row.country,
      gross: Number(Number(row.gross || 0).toFixed(2)),
      count: Number(row.count || 0),
    }));

    // 6. Top Hardware Devices
    const hwRes = await client.execute({
      sql: `
        SELECT
          hardware,
          COUNT(*) AS count,
          COALESCE(SUM(CASE WHEN transaction_type = 'Charge' THEN amount_merchant_currency ELSE 0 END), 0) AS gross
        FROM transactions
        WHERE ${whereSql} AND hardware IS NOT NULL AND hardware != ''
        GROUP BY hardware
        ORDER BY count DESC
        LIMIT 10
      `,
      args: whereArgs,
    });

    const hardwareBreakdown = hwRes.rows.map((row: any) => ({
      hardware: row.hardware,
      count: Number(row.count || 0),
      gross: Number(Number(row.gross || 0).toFixed(2)),
    }));

    // 7. Filter Options: available months and SKUs
    const optMonthRes = await client.execute(`
      SELECT DISTINCT substr(transaction_date, 1, 7) AS month
      FROM transactions
      ORDER BY month ASC
    `);

    const optSkuRes = await client.execute(`
      SELECT DISTINCT sku_id, MAX(product_title) AS title
      FROM transactions
      WHERE sku_id IS NOT NULL AND sku_id != ''
      GROUP BY sku_id
      ORDER BY sku_id ASC
    `);

    const availableMonths = optMonthRes.rows.map((r: any) => r.month as string);
    const availableSkus = [
      { skuId: "tvk_ai_status_pro:yearly", title: "TVK AI Status Pro - Yearly (₹599)" },
      { skuId: "tvk_ai_status_pro:monthly", title: "TVK AI Status Pro - Monthly (₹99)" },
      { skuId: "warrior_pro_monthly", title: "Warrior Pro - Monthly (₹49)" },
      { skuId: "warrior_pro_quarterly", title: "Warrior Pro - 3 Months (₹99)" },
      { skuId: "warrior_pro_yearly", title: "Warrior Pro - 1 Year (₹299)" },
    ];

    return NextResponse.json({
      kpis: {
        gross: Number(gross.toFixed(2)),
        googleFees: Number(googleFees.toFixed(2)),
        taxes: Number(taxes.toFixed(2)),
        refunds: Number(refunds.toFixed(2)),
        net: Number(net.toFixed(2)),
        totalCharges,
        aov: Number(aov.toFixed(2)),
        initialOrders,
        initialRevenue: Number(initialRevenue.toFixed(2)),
        trialConversions,
        directPurchases,
        renewalOrders,
        renewalRevenue: Number(renewalRevenue.toFixed(2)),
        renewalShare: Number(renewalShare.toFixed(1)),
      },
      monthlyTrends,
      skuBreakdown,
      planBreakdown,
      geoBreakdown,
      hardwareBreakdown,
      availableMonths,
      availableSkus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

