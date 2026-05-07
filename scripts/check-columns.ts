import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const res = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'questions'`);
    console.log("Columns in 'questions':", res.rows.map(r => r.column_name));
    
    // Also try the failing query to see the explicit error
    await db.execute(sql`select "id", "topic_id", "text", "text_bn", "type", "required", "active", "min_age", "max_age", "target_gender", "order_index", "created_at" from "questions" limit 1`);
    console.log("Query succeeded!");
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
