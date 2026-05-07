/**
 * Quick Neon connection test — run with: npm run db:test
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;

async function main() {
  console.log("\n🔍 Checking DATABASE_URL...");

  if (!url) {
    console.error("❌ DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  if (url.includes("user:password@host.neon.tech")) {
    console.error("❌ DATABASE_URL is still the PLACEHOLDER value!");
    console.error("   You need to replace it with your real Neon connection string.");
    console.error("\n   How to get it:");
    console.error("   1. Go to https://neon.tech → your project");
    console.error("   2. Click 'Connection Details' on the dashboard");
    console.error("   3. Select 'Connection string' from the dropdown");
    console.error("   4. Copy the full postgresql://... URL");
    console.error("   5. Paste as DATABASE_URL in your .env.local\n");
    process.exit(1);
  }

  try {
    const parsed = new URL(url);
    console.log("✅ DATABASE_URL is set");
    console.log("   Host:", parsed.hostname);
  } catch {
    console.error("❌ DATABASE_URL is not a valid URL. Check for typos.");
    process.exit(1);
  }

  console.log("\n🔌 Testing connection to Neon...");

  try {
    const sql = neon(url);
    const result = await sql`SELECT version()`;
    console.log("✅ Connected successfully!");
    console.log("   PostgreSQL:", result[0].version.split(",")[0]);
    console.log("\n🎉 Your DATABASE_URL is working. Run npm run db:push next.\n");
    process.exit(0);
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("❌ Connection FAILED:", msg);
    if (msg.includes("fetch failed")) {
      console.error("\n   Most likely causes:");
      console.error("   • DATABASE_URL hostname is wrong or typed incorrectly");
      console.error("   • Neon project might be PAUSED → go to neon.tech and click 'Resume'");
      console.error("   • Check your internet connection");
    } else if (msg.includes("password")) {
      console.error("\n   Wrong password — copy the URL fresh from Neon dashboard");
    }
    console.error("");
    process.exit(1);
  }
}

main();
