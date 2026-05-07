CREATE TYPE "public"."assessment_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."auth_event" AS ENUM('register', 'login_success', 'login_fail', 'otp_request', 'otp_verify', 'otp_fail', 'password_reset', 'password_reset_confirm', 'suspicious_activity');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('female', 'male', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('single', 'multi', 'scale', 'date', 'text', 'colorpicker');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'moderate', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'expert', 'admin');--> statement-breakpoint
CREATE TYPE "public"."severity_tag" AS ENUM('none', 'low', 'moderate', 'high', 'critical');--> statement-breakpoint
CREATE TABLE "answer_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"label" text NOT NULL,
	"label_bn" text,
	"value" text NOT NULL,
	"severity" smallint DEFAULT 0 NOT NULL,
	"severity_tag" "severity_tag" DEFAULT 'none' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"next_question_id" uuid,
	"trigger_condition_id" uuid,
	"end_assessment" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"option_id" uuid,
	"free_text_value" text,
	"numeric_value" real,
	"severity" smallint DEFAULT 0 NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"condition_id" uuid NOT NULL,
	"probability_label" text DEFAULT 'Possible' NOT NULL,
	"matched_answer_ids" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"overall_score" real,
	"risk_level" "risk_level",
	"status" "assessment_status" DEFAULT 'in_progress' NOT NULL,
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"report_sent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinicians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"specialty" text,
	"address" text,
	"lat" real,
	"lng" real,
	"phone" text,
	"email" text,
	"website" text,
	"verified" boolean DEFAULT false NOT NULL,
	"added_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "condition_direct_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condition_id" uuid NOT NULL,
	"answer_option_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "condition_topic_map" (
	"condition_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_bn" text,
	"layperson_name_en" text NOT NULL,
	"layperson_name_bn" text,
	"description_en" text NOT NULL,
	"description_bn" text,
	"severity" "risk_level" DEFAULT 'moderate' NOT NULL,
	"urgency_label" text DEFAULT 'Within 1 week' NOT NULL,
	"specialist_type" text,
	"next_steps_en" text,
	"next_steps_bn" text,
	"disclaimer" text DEFAULT 'This is not a diagnosis. Please consult a qualified physician.',
	"scoring_threshold" real,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conditions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "expert_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" varchar(6) NOT NULL,
	"type" varchar(20) DEFAULT 'verify' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"text" text NOT NULL,
	"text_bn" text,
	"type" "question_type" DEFAULT 'single' NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"min_age" smallint DEFAULT 0 NOT NULL,
	"max_age" smallint DEFAULT 120 NOT NULL,
	"target_gender" "gender",
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_thresholds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" "risk_level" NOT NULL,
	"min" real NOT NULL,
	"max" real NOT NULL,
	"label" text NOT NULL,
	"label_bn" text,
	"color" varchar(9) NOT NULL,
	"emoji" text,
	"advice" text,
	"advice_bn" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "score_thresholds_level_unique" UNIQUE("level")
);
--> statement-breakpoint
CREATE TABLE "security_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" "auth_event" NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"endpoint" text,
	"user_id" uuid,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"score" real NOT NULL,
	"raw_score" real NOT NULL,
	"max_score" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"label_bn" text,
	"icon" text DEFAULT '🩺' NOT NULL,
	"color" varchar(9) DEFAULT '#8B5CF6' NOT NULL,
	"description" text,
	"description_bn" text,
	"weight" real DEFAULT 1 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"created_by_expert" uuid,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"age" smallint,
	"gender" "gender",
	"language" varchar(5) DEFAULT 'en' NOT NULL,
	"approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "answer_options" ADD CONSTRAINT "answer_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_options" ADD CONSTRAINT "answer_options_next_question_id_questions_id_fk" FOREIGN KEY ("next_question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_option_id_answer_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."answer_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_conditions" ADD CONSTRAINT "assessment_conditions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_conditions" ADD CONSTRAINT "assessment_conditions_condition_id_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "public"."conditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinicians" ADD CONSTRAINT "clinicians_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condition_direct_triggers" ADD CONSTRAINT "condition_direct_triggers_condition_id_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "public"."conditions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condition_direct_triggers" ADD CONSTRAINT "condition_direct_triggers_answer_option_id_answer_options_id_fk" FOREIGN KEY ("answer_option_id") REFERENCES "public"."answer_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condition_topic_map" ADD CONSTRAINT "condition_topic_map_condition_id_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "public"."conditions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condition_topic_map" ADD CONSTRAINT "condition_topic_map_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_notes" ADD CONSTRAINT "expert_notes_expert_id_users_id_fk" FOREIGN KEY ("expert_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_notes" ADD CONSTRAINT "expert_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_scores" ADD CONSTRAINT "topic_scores_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_scores" ADD CONSTRAINT "topic_scores_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_created_by_expert_users_id_fk" FOREIGN KEY ("created_by_expert") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;