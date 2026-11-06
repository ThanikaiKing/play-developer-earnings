import { NextRequest, NextResponse } from "next/server";
import { client, ensureTablesExist } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureTablesExist();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "50", 10)));
    const search = (searchParams.get("search") || "").trim();
    const month = searchParams.get("month") || "all";
    const sku = searchParams.get("sku") || "all";
    const type = searchParams.get("type") || "all";
    const sortField = searchParams.get("sortField") || "transaction_date";
    const sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const format = searchParams.get("format");

    const whereClauses: string[] = ["1=1"];
    const whereArgs: any[] = [];

    if (month && month !== "all") {
      whereClauses.push("substr(transaction_date, 1, 7) = ?");
      whereArgs.push(month);
    }

    if (sku && sku !== "all") {
      whereClauses.push("sku_id = ?");
      whereArgs.push(sku);
    }

    if (type && type !== "all") {
      if (type === "refund") {
        whereClauses.push("transaction_type LIKE '%refund%'");
      } else {
        whereClauses.push("transaction_type = ?");
        whereArgs.push(type);
      }
    }

    if (search) {
      whereClauses.push("(order_id LIKE ? OR product_title LIKE ? OR buyer_state LIKE ?)");
      const term = `%${search}%`;
      whereArgs.push(term, term, term);
    }

    const whereSql = whereClauses.join(" AND ");

    // Valid sort columns
    const allowedSortColumns: Record<string, string> = {
      transaction_date: "transaction_date",
      transactionDate: "transaction_date",
      amount_merchant_currency: "amount_merchant_currency",
      amount: "amount_merchant_currency",
      order_id: "order_id",
      orderId: "order_id",
      sku_id: "sku_id",
      skuId: "sku_id",
      transaction_type: "transaction_type",
      type: "transaction_type",
    };
    const orderCol = allowedSortColumns[sortField] || "transaction_date";

    // If CSV export is requested, return all filtered records
    if (format === "csv") {
      const allRes = await client.execute({
        sql: `
          SELECT
            transaction_date,
            transaction_time,
            order_id,
            transaction_type,
            product_title,
            sku_id,
            base_plan_id,
            is_renewal,
            buyer_country,
            buyer_state,
            amount_buyer_currency,
            buyer_currency,
            amount_merchant_currency,
            merchant_currency,
            service_fee_percent,
            hardware
          FROM transactions
          WHERE ${whereSql}
          ORDER BY ${orderCol} ${sortDir}, transaction_time ${sortDir}
        `,
        args: whereArgs,
      });

      const csvHeaders = [
        "Transaction Date",
        "Transaction Time",
        "Order ID",
        "Transaction Type",
        "Product Title",
        "SKU ID",
        "Base Plan ID",
        "Is Renewal",
        "Buyer Country",
        "Buyer State",
        "Amount (Buyer Currency)",
        "Buyer Currency",
        "Amount (Merchant Currency)",
        "Merchant Currency",
        "Service Fee %",
        "Hardware",
      ];

      const csvRows = allRes.rows.map((row: any) =>
        [
          `"${row.transaction_date || ""}"`,
          `"${row.transaction_time || ""}"`,
          `"${row.order_id || ""}"`,
          `"${row.transaction_type || ""}"`,
          `"${(row.product_title || "").replace(/"/g, '""')}"`,
          `"${row.sku_id || ""}"`,
          `"${row.base_plan_id || ""}"`,
          row.is_renewal ? "Yes" : "No",
          `"${row.buyer_country || ""}"`,
          `"${row.buyer_state || ""}"`,
          row.amount_buyer_currency ?? 0,
          `"${row.buyer_currency || ""}"`,
          row.amount_merchant_currency ?? 0,
          `"${row.merchant_currency || ""}"`,
          row.service_fee_percent ?? 0,
          `"${row.hardware || ""}"`,
        ].join(",")
      );

      const csvData = [csvHeaders.join(","), ...csvRows].join("\n");
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="playstore_transactions_${month}.csv"`,
        },
      });
    }

    // Total count for pagination
    const countRes = await client.execute({
      sql: `SELECT COUNT(*) AS total FROM transactions WHERE ${whereSql}`,
      args: whereArgs,
    });
    const total = Number((countRes.rows[0] as any).total || 0);

    // Paginated query
    const offset = (page - 1) * pageSize;
    const dataRes = await client.execute({
      sql: `
        SELECT
          id, order_id, is_renewal, renewal_cycle,
          transaction_date, transaction_time, transaction_timestamp,
          tax_type, transaction_type, refund_type, product_title, package_id,
          sku_id, hardware, buyer_country, buyer_state, buyer_postal_code,
          buyer_currency, amount_buyer_currency, currency_conversion_rate,
          merchant_currency, amount_merchant_currency, base_plan_id, offer_id,
          service_fee_percent, sales_channel
        FROM transactions
        WHERE ${whereSql}
        ORDER BY ${orderCol} ${sortDir}, transaction_time ${sortDir}
        LIMIT ? OFFSET ?
      `,
      args: [...whereArgs, pageSize, offset],
    });

    return NextResponse.json({
      transactions: dataRes.rows,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

