import { NextRequest, NextResponse } from "next/server";
import { client, ensureTablesExist } from "@/db";
import { parseGooglePlayCsv } from "@/lib/csv-parser";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await ensureTablesExist();
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const filename = file.name;
      const text = await file.text();

      let parsed;
      try {
        parsed = parseGooglePlayCsv(text, filename);
      } catch (err: any) {
        results.push({
          filename,
          success: false,
          error: err.message,
        });
        continue;
      }

      const { batch, transactions } = parsed;

      // Upsert batch record
      await client.execute({
        sql: `
          INSERT INTO import_batches (
            id, filename, report_month, row_count, charges_count,
            gross_amount, google_fee_amount, taxes_amount, refunds_amount, net_amount, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            row_count=excluded.row_count,
            charges_count=excluded.charges_count,
            gross_amount=excluded.gross_amount,
            google_fee_amount=excluded.google_fee_amount,
            taxes_amount=excluded.taxes_amount,
            refunds_amount=excluded.refunds_amount,
            net_amount=excluded.net_amount
        `,
        args: [
          batch.id,
          batch.filename,
          batch.reportMonth,
          batch.rowCount ?? 0,
          batch.chargesCount ?? 0,
          batch.grossAmount ?? 0,
          batch.googleFeeAmount ?? 0,
          batch.taxesAmount ?? 0,
          batch.refundsAmount ?? 0,
          batch.netAmount ?? 0,
          batch.createdAt,
        ],
      });

      let insertedCount = 0;
      let skippedCount = 0;

      for (const tx of transactions) {
        const res = await client.execute({
          sql: `
            INSERT INTO transactions (
              id, batch_id, order_id, is_renewal, renewal_cycle,
              transaction_date, transaction_time, transaction_timestamp,
              tax_type, transaction_type, refund_type, product_title, package_id,
              product_type, sku_id, hardware, buyer_country, buyer_state,
              buyer_postal_code, buyer_currency, amount_buyer_currency,
              currency_conversion_rate, merchant_currency, amount_merchant_currency,
              base_plan_id, offer_id, group_id, first_usd_1m_eligible,
              service_fee_percent, fee_description, promotion_id, sales_channel
            ) VALUES (
              ?, ?, ?, ?, ?,
              ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?,
              ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?
            )
            ON CONFLICT(id) DO NOTHING
          `,
          args: [
            tx.id,
            tx.batchId ?? null,
            tx.orderId ?? null,
            tx.isRenewal ?? 0,
            tx.renewalCycle ?? 0,
            tx.transactionDate,
            tx.transactionTime,
            tx.transactionTimestamp,
            tx.taxType ?? null,
            tx.transactionType,
            tx.refundType ?? null,
            tx.productTitle ?? null,
            tx.packageId ?? null,
            tx.productType ?? null,
            tx.skuId ?? null,
            tx.hardware ?? null,
            tx.buyerCountry ?? null,
            tx.buyerState ?? null,
            tx.buyerPostalCode ?? null,
            tx.buyerCurrency ?? "INR",
            tx.amountBuyerCurrency ?? 0,
            tx.currencyConversionRate ?? 1,
            tx.merchantCurrency ?? "INR",
            tx.amountMerchantCurrency ?? 0,
            tx.basePlanId ?? null,
            tx.offerId ?? null,
            tx.groupId ?? null,
            tx.firstUsd1mEligible ?? null,
            tx.serviceFeePercent ?? 0,
            tx.feeDescription ?? null,
            tx.promotionId ?? null,
            tx.salesChannel ?? null,
          ],
        });

        if (res.rowsAffected > 0) {
          insertedCount += 1;
        } else {
          skippedCount += 1;
        }
      }

      results.push({
        filename,
        month: batch.reportMonth,
        success: true,
        totalRows: transactions.length,
        insertedCount,
        skippedCount,
        grossAmount: batch.grossAmount,
        netAmount: batch.netAmount,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
