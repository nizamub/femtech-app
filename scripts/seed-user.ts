/**
 * Creates a verified test user for development/testing
 * Run: npm run db:seed-user
 */
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(process.env.DATABASE_URL);

async function seedUser() {
  const hash = await bcrypt.hash("TestPass123!", 12);
  await sql`
    INSERT INTO users (name, email, password_hash, email_verified, role, age, gender, approved)
    VALUES ('Test User', 'test@femhealth.dev', ${hash}, true, 'user', 25, 'female', true)
    ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}, email_verified = true
  `;
  console.log("✅ Test user ready: test@femhealth.dev / TestPass123!");
  process.exit(0);
}
seedUser().catch(e => { console.error(e); process.exit(1); });
