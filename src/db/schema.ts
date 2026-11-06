import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const importBatches = sqliteTable("import_batches", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  reportMonth: text("report_month").notNull(), // e.g. "2026-09"
  rowCount: integer("row_count").notNull().default(0),
  chargesCount: integer("charges_count").notNull().default(0),
  grossAmount: real("gross_amount").notNull().default(0),
  googleFeeAmount: real("google_fee_amount").notNull().default(0),
  taxesAmount: real("taxes_amount").notNull().default(0),
  refundsAmount: real("refunds_amount").notNull().default(0),
  netAmount: real("net_amount").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(), // Deterministic SHA-256 hash for idempotency
    batchId: text("batch_id").references(() => importBatches.id, { onDelete: "cascade" }),
    orderId: text("order_id"), // GPA.xxxx-xxxx-xxxx-xxxxx (null for tax rows)
    baseOrderId: text("base_order_id"), // Base GPA order ID without renewal suffix (e.g. GPA.3398-3215-6148-97126)
    isRenewal: integer("is_renewal").notNull().default(0), // 1 if subsequent renewal cycle
    renewalCycle: integer("renewal_cycle").notNull().default(0), // 0 for initial/trial conversion, 1 for 1st renewal, etc.
    transactionDate: text("transaction_date").notNull(), // YYYY-MM-DD
    transactionTime: text("transaction_time").notNull(), // Original time e.g. 10:33:00 AM PST
    transactionTimestamp: text("transaction_timestamp").notNull(), // ISO timestamp UTC
    taxType: text("tax_type"), // India TDS etc.
    transactionType: text("transaction_type").notNull(), // Charge, Google fee, Tax, Charge refund, Google fee refund
    refundType: text("refund_type"), // Full or null
    productTitle: text("product_title"),
    packageId: text("package_id"),
    productType: text("product_type"), // Subscription, In-app
    skuId: text("sku_id"),
    hardware: text("hardware"),
    buyerCountry: text("buyer_country"),
    buyerState: text("buyer_state"),
    buyerPostalCode: text("buyer_postal_code"),
    buyerCurrency: text("buyer_currency"),
    amountBuyerCurrency: real("amount_buyer_currency").notNull().default(0),
    currencyConversionRate: real("currency_conversion_rate").notNull().default(1),
    merchantCurrency: text("merchant_currency").notNull().default("INR"),
    amountMerchantCurrency: real("amount_merchant_currency").notNull().default(0),
    basePlanId: text("base_plan_id"),
    offerId: text("offer_id"),
    groupId: text("group_id"),
    firstUsd1mEligible: text("first_usd_1m_eligible"),
    serviceFeePercent: real("service_fee_percent").default(0),
    feeDescription: text("fee_description"),
    promotionId: text("promotion_id"),
    salesChannel: text("sales_channel"),
  },
  (table) => [
    index("idx_tx_date").on(table.transactionDate),
    index("idx_tx_sku").on(table.skuId),
    index("idx_tx_order").on(table.orderId),
    index("idx_tx_base_order").on(table.baseOrderId),
    index("idx_tx_type").on(table.transactionType),
    index("idx_tx_batch").on(table.batchId),
  ]
);

export type ImportBatch = typeof importBatches.$inferSelect;
export type NewImportBatch = typeof importBatches.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export const subscriptionMetrics = sqliteTable("subscription_metrics", {
  date: text("date").primaryKey(), // YYYY-MM-DD
  totalSubscriptions: integer("total_subscriptions").notNull().default(0),
  newSubscriptions: integer("new_subscriptions").notNull().default(0),
  canceledSubscriptions: integer("canceled_subscriptions").notNull().default(0),
  netGrowth: integer("net_growth").notNull().default(0),
  notes: text("notes"),
});

export type SubscriptionMetric = typeof subscriptionMetrics.$inferSelect;
export type NewSubscriptionMetric = typeof subscriptionMetrics.$inferInsert;


