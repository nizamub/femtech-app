/**
 * FemHealth — Direct SQL table creation via Neon HTTP API
 * This bypasses the drizzle-kit WebSocket issue.
 * Run with: npm run db:create-tables
 */
import { neon } from "@neondatabase/serverless";

async function createTables() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("user:password@host.neon.tech")) {
    console.error("❌ DATABASE_URL is not set or still placeholder in .env.local");
    process.exit(1);
  }

  const sql = neon(url);
  console.log("🔨 Creating database tables in Neon...\n");

  // Use tagged template literals — the ONLY way Neon HTTP API executes DDL
  const steps: Array<{ name: string; fn: () => Promise<any> }> = [
    { name: "enum: role",        fn: () => sql`DO $$ BEGIN CREATE TYPE role AS ENUM ('user', 'expert', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$` },
    { name: "enum: gender",      fn: () => sql`DO $$ BEGIN CREATE TYPE gender AS ENUM ('female', 'male', 'other', 'prefer_not_to_say'); EXCEPTION WHEN duplicate_object THEN null; END $$` },
    { name: "enum: risk_level",  fn: () => sql`DO $$ BEGIN CREATE TYPE risk_level AS ENUM ('low', 'moderate', 'high', 'critical'); EXCEPTION WHEN duplicate_object THEN null; END $$` },

    { name: "table: users", fn: () => sql`
      CREATE TABLE IF NOT EXISTS users (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name           TEXT NOT NULL,
        email          TEXT NOT NULL UNIQUE,
        password_hash  TEXT,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        role           role NOT NULL DEFAULT 'user',
        age            SMALLINT,
        gender         gender,
        language       VARCHAR(5) NOT NULL DEFAULT 'en',
        created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
      )` },

    { name: "table: otp_tokens", fn: () => sql`
      CREATE TABLE IF NOT EXISTS otp_tokens (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email      TEXT NOT NULL,
        token      VARCHAR(6) NOT NULL,
        type       VARCHAR(20) NOT NULL DEFAULT 'verify',
        expires_at TIMESTAMP NOT NULL,
        used       BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )` },

    { name: "table: topics", fn: () => sql`
      CREATE TABLE IF NOT EXISTS topics (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug              TEXT NOT NULL UNIQUE,
        label             TEXT NOT NULL,
        label_bn          TEXT,
        icon              TEXT NOT NULL DEFAULT '🩺',
        color             VARCHAR(9) NOT NULL DEFAULT '#8B5CF6',
        description       TEXT,
        description_bn    TEXT,
        weight            REAL NOT NULL DEFAULT 1,
        visible           BOOLEAN NOT NULL DEFAULT true,
        is_custom         BOOLEAN NOT NULL DEFAULT false,
        created_by_expert UUID REFERENCES users(id) ON DELETE SET NULL,
        order_index       INTEGER NOT NULL DEFAULT 0,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW()
      )` },

    { name: "table: questions", fn: () => sql`
      CREATE TABLE IF NOT EXISTS questions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        text        TEXT NOT NULL,
        text_bn     TEXT,
        required    BOOLEAN NOT NULL DEFAULT true,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
      )` },

    { name: "table: answer_options", fn: () => sql`
      CREATE TABLE IF NOT EXISTS answer_options (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        label       TEXT NOT NULL,
        label_bn    TEXT,
        value       TEXT NOT NULL,
        severity    SMALLINT NOT NULL DEFAULT 0,
        order_index INTEGER NOT NULL DEFAULT 0
      )` },

    { name: "table: assessments", fn: () => sql`
      CREATE TABLE IF NOT EXISTS assessments (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        started_at    TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at  TIMESTAMP,
        overall_score REAL,
        risk_level    risk_level,
        language      VARCHAR(5) NOT NULL DEFAULT 'en',
        report_sent   BOOLEAN NOT NULL DEFAULT false
      )` },

    { name: "table: assessment_answers", fn: () => sql`
      CREATE TABLE IF NOT EXISTS assessment_answers (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        topic_id      UUID NOT NULL REFERENCES topics(id),
        question_id   UUID NOT NULL REFERENCES questions(id),
        option_id     UUID NOT NULL REFERENCES answer_options(id),
        severity      SMALLINT NOT NULL
      )` },

    { name: "table: topic_scores", fn: () => sql`
      CREATE TABLE IF NOT EXISTS topic_scores (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        topic_id      UUID NOT NULL REFERENCES topics(id),
        score         REAL NOT NULL,
        raw_score     REAL NOT NULL,
        max_score     REAL NOT NULL
      )` },

    { name: "table: clinicians", fn: () => sql`
      CREATE TABLE IF NOT EXISTS clinicians (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name       TEXT NOT NULL,
        specialty  TEXT,
        address    TEXT,
        lat        REAL,
        lng        REAL,
        phone      TEXT,
        email      TEXT,
        verified   BOOLEAN NOT NULL DEFAULT false,
        added_by   UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )` },

    { name: "table: score_thresholds", fn: () => sql`
      CREATE TABLE IF NOT EXISTS score_thresholds (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        level      risk_level NOT NULL UNIQUE,
        min        REAL NOT NULL,
        max        REAL NOT NULL,
        label      TEXT NOT NULL,
        label_bn   TEXT,
        color      VARCHAR(9) NOT NULL,
        emoji      TEXT,
        advice     TEXT,
        advice_bn  TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )` },

    { name: "table: expert_notes", fn: () => sql`
      CREATE TABLE IF NOT EXISTS expert_notes (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expert_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        note       TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )` },
  ];

  let failed = 0;
  for (const step of steps) {
    try {
      await step.fn();
      console.log(`  ✅ ${step.name}`);
    } catch (err: any) {
      console.error(`  ❌ ${step.name}: ${err.message}`);
      failed++;
    }
  }

  if (failed === 0) {
    console.log("\n🎉 All tables created successfully!");
    console.log("   Next step: npm run db:seed\n");
  } else {
    console.log(`\n⚠️  ${failed} step(s) failed. Check errors above.`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

createTables().catch(err => {
  console.error("❌ Fatal:", err.message || err);
  process.exit(1);
});
