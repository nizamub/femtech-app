import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  const sql = neon(process.env.DATABASE_URL);
  const hash = await bcrypt.hash("Expert123!", 12);
  
  await sql`
    INSERT INTO users (name, email, password_hash, email_verified, role, approved)
    VALUES ('Expert User', 'expert@femhealth.dev', ${hash}, true, 'expert', true)
    ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}, email_verified = true, role = 'expert', approved = true
  `;
  
  console.log("✅ Expert seeded: expert@femhealth.dev / Expert123!");
  process.exit(0);
}

main().catch(console.error);
