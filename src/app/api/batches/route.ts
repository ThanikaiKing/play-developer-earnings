import { NextRequest, NextResponse } from "next/server";
import { client, ensureTablesExist } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureTablesExist();
    const result = await client.execute(`
      SELECT 
        id, filename, report_month, row_count, charges_count,
        gross_amount, google_fee_amount, taxes_amount, refunds_amount, net_amount, created_at
      FROM import_batches
      ORDER BY report_month DESC, created_at DESC
    `);

    return NextResponse.json({ batches: result.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureTablesExist();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Delete transactions for this batch first
    await client.execute({
      sql: `DELETE FROM transactions WHERE batch_id = ?`,
      args: [id],
    });

    // Delete batch record
    await client.execute({
      sql: `DELETE FROM import_batches WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

