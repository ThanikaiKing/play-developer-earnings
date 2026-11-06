# Google Play Store Earnings & Subscription Analytics Platform

A high-performance Next.js application built with **Next.js 15**, **Drizzle ORM**, **LibSQL / Turso**, **Tailwind CSS**, and **Recharts** to ingest, store, query, reconcile, and visualize Google Play Developer Console monthly earnings reports.

---

## 🌟 Key Features

1. **Active Subscribers & Payment Trail Explorer (`/subscribers`)**
   - **Active vs Expired Tracking**: Instant visibility of **84 currently active subscribers** (Yearly 365-day plans + Monthly subscribers billed in current cycle).
   - **Accurate 3-Day Free Trial Conversion Handling**: Correctly recognizes `GPA.xxxx..0` as the **First Paid Conversion** from trial ($0.00 trial order -> first paid conversion `..0`), while `..1`, `..2`, `..3` are tracked as subsequent recurring renewals.
   - **Interactive Drill-Down Modal**: Clicking on any subscriber opens their complete profile and visual chronological payment trail showing every billing event, Google Fee (15%), Net payout, and device used.
   - **Subscriber Lifetime Value (LTV)**: Track total spend and renewal count per customer.

2. **Executive Revenue Dashboard (`/`)**
   - **Net Developer Payout**: Exact amount deposited into bank account after platform commissions and statutory withholdings.
   - **Gross Customer Spend**: Total transaction charges collected from users.
   - **Google Commission Deductions**: 15% Google Play Tier fee tracking.
   - **India Section 194-O TDS**: Detailed tracking of tax deducted at source by Google.
   - **First-Time Conversions vs Renewals**: Clear breakdown of 3-Day Trial Conversions (`..0`) vs Direct Purchases vs Recurring Renewals (`..1+`).
   - **Product & SKU Breakdown**: Distribution between subscriptions (`tvk_ai_status_pro`, `warrior_pro_monthly`, `warrior_pro_quarterly`, `warrior_pro_yearly`).
   - **Geographic & Hardware Insights**: State-by-state gross spend and top customer Android smartphone models.

2. **Drag & Drop CSV Ingestion Engine**
   - Upload future monthly reports (`PlayApps_YYYYMM.csv`) directly in the browser via `/upload`.
   - **100% Idempotent Deduplication**: Deterministic SHA-256 transaction signatures prevent duplicate entries when uploading overlapping CSVs or re-running ingestion.
   - **Batch Management**: View imported file history, row counts, net payout, and manage or delete individual month batches.

3. **Tax & Payout Reconciliation Sheet (`/reconciliation`)**
   - CA and Chartered Accountant ready financial statement formatted by month.
   - Clearly isolates Gross, 15% Google Commission, Refunds, India Sec 194-O TDS, and Net Remittance.
   - Printable or exportable to clean CSV with a single click.

4. **Interactive Transactions Explorer (`/transactions`)**
   - Live search across GPA order IDs, products, and states.
   - Filter by month, SKU, and transaction type (Charge, Google fee, Tax, Refund).
   - Paginated table with renewal cycle badges and colored credit/debit indicators.
   - 1-click export of filtered transaction records to CSV.

5. **Optional PIN Access Protection**
   - Set `DASHBOARD_PIN=1234` in `.env.local` or Vercel environment variables to password-protect financial revenue data.
   - If left blank, the dashboard is open for direct access.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Ingest Existing Reports from `/data`
```bash
npm run db:seed
```
This automatically parses all CSV files in `/data` (Feb–Sep 2026), creates the SQLite database `earnings.db`, and ingests all records idempotently.

### 3. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel with Persistent Storage

The application uses **LibSQL** (`@libsql/client`).
- **Locally**: Uses a local SQLite file (`file:earnings.db`) with zero setup or credentials needed.
- **On Vercel**: Connects directly to **Turso** (Serverless SQLite over HTTPS/WebSocket) for persistent storage across serverless function invocations.

### Step 1: Create a Free Turso Database (2 minutes)
If you don't already have a Turso database:
1. Install Turso CLI or log in at [turso.tech](https://turso.tech).
2. Create a new database:
   ```bash
   turso db create playstore-earnings
   ```
3. Get the database URL and create an auth token:
   ```bash
   turso db show playstore-earnings --url
   turso db tokens create playstore-earnings
   ```

### Step 2: Seed the Turso Database from your Computer
Run the seed script against Turso:
```bash
TURSO_DATABASE_URL="libsql://playstore-earnings-[your-user].turso.io" TURSO_AUTH_TOKEN="your_token_here" npm run db:seed
```

### Step 3: Deploy to Vercel
1. Push your repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. In **Environment Variables**, add:
   - `TURSO_DATABASE_URL`: Your Turso database URL (`libsql://...`)
   - `TURSO_AUTH_TOKEN`: Your Turso auth token
   - `DASHBOARD_PIN`: (Optional) Your dashboard PIN, e.g. `1234`
4. Click **Deploy**!

Your earnings platform will be live on Vercel with persistent storage and automatic SSL. Future monthly CSVs can be uploaded directly from the browser on the deployed site.

---

## 📁 Repository Structure

```
├── data/                                 # Google Play Console CSV reports
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with PIN authentication gate
│   │   ├── page.tsx                      # Main Revenue Analytics Dashboard
│   │   ├── upload/page.tsx               # Drag-and-drop CSV Ingestion Center
│   │   ├── transactions/page.tsx         # Searchable Transaction Explorer & Export
│   │   ├── reconciliation/page.tsx       # Tax & Section 194-O Reconciliation Sheet
│   │   └── api/
│   │       ├── analytics/route.ts        # Aggregated KPI and chart analytics
│   │       ├── transactions/route.ts     # Paginated & filtered transactions query
│   │       ├── upload/route.ts           # Multipart CSV parser and deduplicator
│   │       ├── batches/route.ts          # Batch management & deletion
│   │       └── auth/route.ts             # PIN authorization and cookie session
│   ├── components/
│   │   ├── Navigation.tsx                # App header & navigation tabs
│   │   ├── MetricCard.tsx                # KPI metric card component
│   │   ├── RevenueChart.tsx              # Monthly Gross/Net/Fee trends chart
│   │   ├── SkuBreakdownChart.tsx         # SKU & product share donut chart
│   │   ├── RenewalRatioChart.tsx         # New User vs Recurring Renewal cohort chart
│   │   ├── GeoDeviceChart.tsx            # State breakdown & smartphone models
│   │   ├── FilterBar.tsx                 # Month and SKU filter controls
│   │   └── PinModal.tsx                  # PIN verification modal
│   ├── db/
│   │   ├── schema.ts                     # Drizzle ORM schema (batches & transactions)
│   │   ├── index.ts                      # LibSQL client singleton with auto-bootstrap
│   │   └── seed.ts                       # CLI seed script for /data files
│   └── lib/
│       ├── csv-parser.ts                 # Google Play Console CSV parser & deduplicator
│       ├── currency.ts                   # INR formatting & conversions
│       └── utils.ts                      # Date formatting & CSS class merge
├── package.json
└── tsconfig.json
```

