import fs from "fs";
import path from "path";
import { client, ensureTablesExist } from "./index";
import { parseGooglePlayCsv } from "../lib/csv-parser";

async function findCsvFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findCsvFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".csv")) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

async function runSeed() {
  console.log("🚀 Starting Play Store Earnings Data Seeding...");
  await ensureTablesExist();

  const dataDir = path.resolve(process.cwd(), "data");
  const files = await findCsvFiles(dataDir);

  if (files.length === 0) {
    console.log("No CSV files found in /data directory.");
    return;
  }

  console.log(`Found ${files.length} CSV files to process:`);
  for (const f of files) {
    console.log(`  - ${path.relative(process.cwd(), f)}`);
  }

  let totalInsertedTx = 0;
  let totalSkippedTx = 0;
  let grandGross = 0;
  let grandFee = 0;
  let grandTax = 0;
  let grandRefund = 0;
  let grandNet = 0;

  for (const filePath of files) {
    const filename = path.basename(filePath);
    const content = fs.readFileSync(filePath, "utf-8");

    let parsedResult;
    try {
      parsedResult = parseGooglePlayCsv(content, filename);
    } catch (e: any) {
      console.log(`⚠️  Skipping non-earnings CSV: ${filename} (${e.message})`);
      continue;
    }

    const { batch, transactions } = parsedResult;

    // Upsert batch
    await client.execute({
      sql: `
        INSERT INTO import_batches (id, filename, report_month, row_count, charges_count, gross_amount, google_fee_amount, taxes_amount, refunds_amount, net_amount, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    let insertedForBatch = 0;
    let skippedForBatch = 0;

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
        insertedForBatch += 1;
      } else {
        skippedForBatch += 1;
      }
    }

    totalInsertedTx += insertedForBatch;
    totalSkippedTx += skippedForBatch;
    grandGross += batch.grossAmount;
    grandFee += batch.googleFeeAmount;
    grandTax += batch.taxesAmount;
    grandRefund += batch.refundsAmount;
    grandNet += batch.netAmount;

    console.log(
      `✓ ${filename} (${batch.reportMonth}): ${insertedForBatch} new, ${skippedForBatch} duplicates. Net: ₹${batch.netAmount.toFixed(2)}`
    );
  }

  console.log("\n================ SEED SUMMARY ================");
  console.log(`Total Files Processed   : ${files.length}`);
  console.log(`Total Records Inserted  : ${totalInsertedTx}`);
  console.log(`Duplicates Skipped      : ${totalSkippedTx}`);
  console.log(`Grand Gross Revenue     : ₹${grandGross.toFixed(2)}`);
  console.log(`Google Platform Fees    : ₹${grandFee.toFixed(2)}`);
  console.log(`Total Refunds           : ₹${grandRefund.toFixed(2)}`);
  console.log(`India TDS Tax Withheld  : ₹${grandTax.toFixed(2)}`);
  console.log(`Grand Net Payout        : ₹${grandNet.toFixed(2)}`);
  console.log("==============================================\n");
}

runSeed()
  .then(() => {
    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
