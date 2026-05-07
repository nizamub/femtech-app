/**
 * FemHealth — Raw SQL Migration Script (Phase 1)
 * Adds all new tables, columns, and enums required by PRD v1.0
 * without touching existing tables that already work.
 * Run with: npm run db:migrate
 */
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("🔧 Running Phase 1 migrations...\n");

  // ─── New Enums ────────────────────────────────────────────────────────────
  console.log("  → Creating enums...");
  await sql`
    DO $$ BEGIN
      CREATE TYPE question_type AS ENUM ('single','multi','scale','date','text','colorpicker');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE assessment_status AS ENUM ('in_progress','completed','abandoned');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE severity_tag AS ENUM ('none','low','moderate','high','critical');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE auth_event AS ENUM (
        'register','login_success','login_fail',
        'otp_request','otp_verify','otp_fail',
        'password_reset','password_reset_confirm','suspicious_activity'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `;
  console.log("     ✓ Enums ready");

  // ─── Alter existing tables ────────────────────────────────────────────────
  console.log("  → Patching existing tables...");

  // users: add approved column
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT true;
  `;

  // questions: add type + active columns + demographics
  await sql`
    ALTER TABLE questions
      ADD COLUMN IF NOT EXISTS type question_type NOT NULL DEFAULT 'single',
      ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS min_age SMALLINT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS max_age SMALLINT NOT NULL DEFAULT 120,
      ADD COLUMN IF NOT EXISTS target_gender gender;
  `;

  // answer_options: add branch logic + severity_tag columns
  await sql`
    ALTER TABLE answer_options
      ADD COLUMN IF NOT EXISTS severity_tag severity_tag NOT NULL DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS next_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS trigger_condition_id UUID,
      ADD COLUMN IF NOT EXISTS end_assessment BOOLEAN NOT NULL DEFAULT false;
  `;

  // assessments: add topic_ids jsonb + status enum column
  await sql`
    ALTER TABLE assessments
      ADD COLUMN IF NOT EXISTS topic_ids JSONB NOT NULL DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS status assessment_status NOT NULL DEFAULT 'in_progress';
  `;

  // assessment_answers: allow optionId to be nullable (text/scale answers)
  await sql`
    ALTER TABLE assessment_answers
      ALTER COLUMN option_id DROP NOT NULL;
  `;
  // assessment_answers: add free text, numeric, answeredAt columns
  await sql`
    ALTER TABLE assessment_answers
      ADD COLUMN IF NOT EXISTS free_text_value TEXT,
      ADD COLUMN IF NOT EXISTS numeric_value REAL,
      ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP NOT NULL DEFAULT NOW();
  `;

  // clinicians: add website column
  await sql`
    ALTER TABLE clinicians ADD COLUMN IF NOT EXISTS website TEXT;
  `;

  console.log("     ✓ Existing tables patched");

  // ─── New Tables ───────────────────────────────────────────────────────────
  console.log("  → Creating new tables...");

  // conditions
  await sql`
    CREATE TABLE IF NOT EXISTS conditions (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug              TEXT NOT NULL UNIQUE,
      name_en           TEXT NOT NULL,
      name_bn           TEXT,
      layperson_name_en TEXT NOT NULL,
      layperson_name_bn TEXT,
      description_en    TEXT NOT NULL,
      description_bn    TEXT,
      severity          risk_level NOT NULL DEFAULT 'moderate',
      urgency_label     TEXT NOT NULL DEFAULT 'Within 1 week',
      specialist_type   TEXT,
      next_steps_en     TEXT,
      next_steps_bn     TEXT,
      disclaimer        TEXT DEFAULT 'This is not a diagnosis. Please consult a qualified physician.',
      scoring_threshold REAL,
      active            BOOLEAN NOT NULL DEFAULT true,
      created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  // Now add FK from answer_options.trigger_condition_id → conditions.id
  await sql`
    DO $$ BEGIN
      ALTER TABLE answer_options
        ADD CONSTRAINT ao_trigger_condition_fk
        FOREIGN KEY (trigger_condition_id) REFERENCES conditions(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `;

  // condition_topic_map
  await sql`
    CREATE TABLE IF NOT EXISTS condition_topic_map (
      condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
      topic_id     UUID NOT NULL REFERENCES topics(id)     ON DELETE CASCADE,
      PRIMARY KEY (condition_id, topic_id)
    );
  `;

  // condition_direct_triggers
  await sql`
    CREATE TABLE IF NOT EXISTS condition_direct_triggers (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      condition_id     UUID NOT NULL REFERENCES conditions(id)     ON DELETE CASCADE,
      answer_option_id UUID NOT NULL REFERENCES answer_options(id) ON DELETE CASCADE
    );
  `;

  // assessment_conditions
  await sql`
    CREATE TABLE IF NOT EXISTS assessment_conditions (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assessment_id     UUID NOT NULL REFERENCES assessments(id)  ON DELETE CASCADE,
      condition_id      UUID NOT NULL REFERENCES conditions(id),
      probability_label TEXT NOT NULL DEFAULT 'Possible',
      matched_answer_ids JSONB NOT NULL DEFAULT '[]'
    );
  `;

  // security_logs
  await sql`
    CREATE TABLE IF NOT EXISTS security_logs (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event      auth_event NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      endpoint   TEXT,
      user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
      meta       JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  // expert_notes: add updated_at if missing
  await sql`
    ALTER TABLE expert_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
  `;

  console.log("     ✓ New tables created");
  console.log("\n✅ Phase 1 migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
