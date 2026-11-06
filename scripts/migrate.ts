import { client, ensureTablesExist } from "../src/db";

async function main() {
  await ensureTablesExist();

  // Populate base_order_id
  await client.execute(`
    UPDATE transactions 
    SET base_order_id = CASE 
      WHEN order_id IS NOT NULL THEN (
        CASE 
          WHEN instr(order_id, '..') > 0 THEN substr(order_id, 1, instr(order_id, '..') - 1)
          ELSE order_id 
        END
      )
      ELSE NULL 
    END
  `);

  // Suffix ..0 is trial conversion (first paid charge, NOT renewal)
  // Suffix ..1, ..2, ..3 etc are renewals
  await client.execute(`
    UPDATE transactions 
    SET 
      is_renewal = CASE 
        WHEN order_id LIKE '%..1%' OR order_id LIKE '%..2%' OR order_id LIKE '%..3%' OR order_id LIKE '%..4%' OR order_id LIKE '%..5%' THEN 1 
        ELSE 0 
      END,
      renewal_cycle = CASE 
        WHEN order_id LIKE '%..1%' THEN 1
        WHEN order_id LIKE '%..2%' THEN 2
        WHEN order_id LIKE '%..3%' THEN 3
        WHEN order_id LIKE '%..4%' THEN 4
        WHEN order_id LIKE '%..5%' THEN 5
        ELSE 0 
      END
  `);

  const res = await client.execute(`
    SELECT 
      COUNT(*) AS total_tx,
      COUNT(DISTINCT base_order_id) AS total_subscribers,
      SUM(CASE WHEN transaction_type = 'Charge' AND is_renewal = 0 THEN 1 ELSE 0 END) AS initial_charges,
      SUM(CASE WHEN transaction_type = 'Charge' AND is_renewal = 1 THEN 1 ELSE 0 END) AS renewal_charges
    FROM transactions
  `);

  console.log("Migration result:", res.rows[0]);
}

main().catch(console.error);

