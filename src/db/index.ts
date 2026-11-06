import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL || "file:earnings.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

/**
 * Ensures the database tables and indexes exist.
 * This guarantees zero-config bootstrap for both local SQLite and Turso.
 */
export async function ensureTablesExist() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      report_month TEXT NOT NULL,
      row_count INTEGER NOT NULL DEFAULT 0,
      charges_count INTEGER NOT NULL DEFAULT 0,
      gross_amount REAL NOT NULL DEFAULT 0,
      google_fee_amount REAL NOT NULL DEFAULT 0,
      taxes_amount REAL NOT NULL DEFAULT 0,
      refunds_amount REAL NOT NULL DEFAULT 0,
      net_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      batch_id TEXT REFERENCES import_batches(id) ON DELETE CASCADE,
      order_id TEXT,
      base_order_id TEXT,
      is_renewal INTEGER NOT NULL DEFAULT 0,
      renewal_cycle INTEGER NOT NULL DEFAULT 0,
      transaction_date TEXT NOT NULL,
      transaction_time TEXT NOT NULL,
      transaction_timestamp TEXT NOT NULL,
      tax_type TEXT,
      transaction_type TEXT NOT NULL,
      refund_type TEXT,
      product_title TEXT,
      package_id TEXT,
      product_type TEXT,
      sku_id TEXT,
      hardware TEXT,
      buyer_country TEXT,
      buyer_state TEXT,
      buyer_postal_code TEXT,
      buyer_currency TEXT,
      amount_buyer_currency REAL NOT NULL DEFAULT 0,
      currency_conversion_rate REAL NOT NULL DEFAULT 1,
      merchant_currency TEXT NOT NULL DEFAULT 'INR',
      amount_merchant_currency REAL NOT NULL DEFAULT 0,
      base_plan_id TEXT,
      offer_id TEXT,
      group_id TEXT,
      first_usd_1m_eligible TEXT,
      service_fee_percent REAL DEFAULT 0,
      fee_description TEXT,
      promotion_id TEXT,
      sales_channel TEXT
    );
  `);

  try {
    await client.execute(`ALTER TABLE transactions ADD COLUMN base_order_id TEXT;`);
  } catch {
    // Column already exists
  }

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(transaction_date);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_tx_sku ON transactions(sku_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_tx_order ON transactions(order_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_tx_base_order ON transactions(base_order_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(transaction_type);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_tx_batch ON transactions(batch_id);`);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS subscription_metrics (
      date TEXT PRIMARY KEY,
      total_subscriptions INTEGER NOT NULL DEFAULT 0,
      new_subscriptions INTEGER NOT NULL DEFAULT 0,
      canceled_subscriptions INTEGER NOT NULL DEFAULT 0,
      net_growth INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );
  `);
}

