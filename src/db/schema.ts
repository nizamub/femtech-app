import {
  pgTable, text, integer, boolean, timestamp, real, pgEnum,
  uuid, varchar, smallint, jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "expert", "admin"]);
export const genderEnum = pgEnum("gender", ["female", "male", "other", "prefer_not_to_say"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "moderate", "high", "critical"]);
export const questionTypeEnum = pgEnum("question_type", ["single", "multi", "scale", "date", "text", "colorpicker"]);
export const assessmentStatusEnum = pgEnum("assessment_status", ["in_progress", "completed", "abandoned"]);
export const severityTagEnum = pgEnum("severity_tag", ["none", "low", "moderate", "high", "critical"]);
export const authEventEnum = pgEnum("auth_event", [
  "register", "login_success", "login_fail",
  "otp_request", "otp_verify", "otp_fail",
  "password_reset", "password_reset_confirm",
  "suspicious_activity",
]);

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").notNull().default(false),
  role: roleEnum("role").notNull().default("user"),
  age: smallint("age"),
  gender: genderEnum("gender"),
  language: varchar("language", { length: 5 }).notNull().default("en"),
  approved: boolean("approved").notNull().default(true), // experts need admin approval
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── OTP Tokens (email verification + password reset) ──────────────────────────
export const otpTokens = pgTable("otp_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  token: varchar("token", { length: 6 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("verify"), // 'verify' | 'reset'
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Topics ────────────────────────────────────────────────────────────────────
export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  labelBn: text("label_bn"),
  icon: text("icon").notNull().default("🩺"),
  color: varchar("color", { length: 9 }).notNull().default("#8B5CF6"),
  description: text("description"),
  descriptionBn: text("description_bn"),
  weight: real("weight").notNull().default(1),
  visible: boolean("visible").notNull().default(true),
  isCustom: boolean("is_custom").notNull().default(false),
  createdByExpert: uuid("created_by_expert").references(() => users.id, { onDelete: "set null" }),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Questions ─────────────────────────────────────────────────────────────────
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  textBn: text("text_bn"),
  type: questionTypeEnum("type").notNull().default("single"),
  required: boolean("required").notNull().default(true),
  active: boolean("active").notNull().default(true),
  minAge: smallint("min_age").notNull().default(0),
  maxAge: smallint("max_age").notNull().default(120),
  targetGender: genderEnum("target_gender"), // null means all genders
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Answer Options ────────────────────────────────────────────────────────────
export const answerOptions = pgTable("answer_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  labelBn: text("label_bn"),
  value: text("value").notNull(),
  severity: smallint("severity").notNull().default(0), // 0–10
  severityTag: severityTagEnum("severity_tag").notNull().default("none"),
  orderIndex: integer("order_index").notNull().default(0),
  // Branch logic
  nextQuestionId: uuid("next_question_id").references(() => questions.id, { onDelete: "set null" }),
  triggerConditionId: uuid("trigger_condition_id"),                 // FK set after conditions table
  endAssessment: boolean("end_assessment").notNull().default(false),
});

// ── Conditions ────────────────────────────────────────────────────────────────
export const conditions = pgTable("conditions", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameBn: text("name_bn"),
  laypersonNameEn: text("layperson_name_en").notNull(),
  laypersonNameBn: text("layperson_name_bn"),
  descriptionEn: text("description_en").notNull(),
  descriptionBn: text("description_bn"),
  severity: riskLevelEnum("severity").notNull().default("moderate"),
  urgencyLabel: text("urgency_label").notNull().default("Within 1 week"),
  specialistType: text("specialist_type"),
  nextStepsEn: text("next_steps_en"),
  nextStepsBn: text("next_steps_bn"),
  disclaimer: text("disclaimer").default("This is not a diagnosis. Please consult a qualified physician."),
  scoringThreshold: real("scoring_threshold"),                      // min score to trigger (optional)
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Condition ↔ Topic (many-to-many) ─────────────────────────────────────────
export const conditionTopicMap = pgTable("condition_topic_map", {
  conditionId: uuid("condition_id").notNull().references(() => conditions.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
});

// ── Condition Direct Triggers (specific answer option → condition) ─────────────
export const conditionDirectTriggers = pgTable("condition_direct_triggers", {
  id: uuid("id").primaryKey().defaultRandom(),
  conditionId: uuid("condition_id").notNull().references(() => conditions.id, { onDelete: "cascade" }),
  answerOptionId: uuid("answer_option_id").notNull().references(() => answerOptions.id, { onDelete: "cascade" }),
});

// ── Assessments ───────────────────────────────────────────────────────────────
export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topicIds: jsonb("topic_ids").notNull().default([]),             // array of topic UUIDs
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  overallScore: real("overall_score"),                               // 0–100
  riskLevel: riskLevelEnum("risk_level"),
  status: assessmentStatusEnum("status").notNull().default("in_progress"),
  language: varchar("language", { length: 5 }).notNull().default("en"),
  reportSent: boolean("report_sent").notNull().default(false),
});

// ── Assessment Answers ────────────────────────────────────────────────────────
export const assessmentAnswers = pgTable("assessment_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").notNull().references(() => topics.id),
  questionId: uuid("question_id").notNull().references(() => questions.id),
  optionId: uuid("option_id").references(() => answerOptions.id, { onDelete: "set null" }),
  freeTextValue: text("free_text_value"),
  numericValue: real("numeric_value"),
  severity: smallint("severity").notNull().default(0),
  answeredAt: timestamp("answered_at").notNull().defaultNow(),
});

// ── Per-topic Scores ──────────────────────────────────────────────────────────
export const topicScores = pgTable("topic_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").notNull().references(() => topics.id),
  score: real("score").notNull(),
  rawScore: real("raw_score").notNull(),
  maxScore: real("max_score").notNull(),
});

// ── Assessment Conditions (triggered per assessment) ──────────────────────────
export const assessmentConditions = pgTable("assessment_conditions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  conditionId: uuid("condition_id").notNull().references(() => conditions.id),
  probabilityLabel: text("probability_label").notNull().default("Possible"), // Likely | Possible | Requires Investigation
  matchedAnswerIds: jsonb("matched_answer_ids").notNull().default([]),        // array of answerOption UUIDs
});

// ── Clinicians ─────────────────────────────────────────────────────────────────
export const clinicians = pgTable("clinicians", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  specialty: text("specialty"),
  address: text("address"),
  lat: real("lat"),
  lng: real("lng"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  verified: boolean("verified").notNull().default(false),
  addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Score Thresholds (expert-configurable) ────────────────────────────────────
export const scoreThresholds = pgTable("score_thresholds", {
  id: uuid("id").primaryKey().defaultRandom(),
  level: riskLevelEnum("level").notNull().unique(),
  min: real("min").notNull(),
  max: real("max").notNull(),
  label: text("label").notNull(),
  labelBn: text("label_bn"),
  color: varchar("color", { length: 9 }).notNull(),
  emoji: text("emoji"),
  advice: text("advice"),
  adviceBn: text("advice_bn"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Expert Notes on Users ──────────────────────────────────────────────────────
export const expertNotes = pgTable("expert_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  expertId: uuid("expert_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Security Logs ──────────────────────────────────────────────────────────────
export const securityLogs = pgTable("security_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  event: authEventEnum("event").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  endpoint: text("endpoint"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  meta: jsonb("meta"),                                         // extra context (e.g. reason)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Relations ─────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  assessments: many(assessments),
  otpTokens: many(otpTokens),
  notes: many(expertNotes, { relationName: "userNotes" }),
  expertNotes: many(expertNotes, { relationName: "expertNotes" }),
  securityLogs: many(securityLogs),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  questions: many(questions),
  topicScores: many(topicScores),
  conditionTopicMaps: many(conditionTopicMap),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  topic: one(topics, { fields: [questions.topicId], references: [topics.id] }),
  options: many(answerOptions),
  assessmentAnswers: many(assessmentAnswers),
}));

export const answerOptionsRelations = relations(answerOptions, ({ one, many }) => ({
  question: one(questions, { fields: [answerOptions.questionId], references: [questions.id] }),
  nextQuestion: one(questions, { fields: [answerOptions.nextQuestionId], references: [questions.id], relationName: "branchTarget" }),
  directTriggers: many(conditionDirectTriggers),
  assessmentAnswers: many(assessmentAnswers),
}));

export const conditionsRelations = relations(conditions, ({ many }) => ({
  topicMaps: many(conditionTopicMap),
  directTriggers: many(conditionDirectTriggers),
  assessmentConditions: many(assessmentConditions),
}));

export const conditionTopicMapRelations = relations(conditionTopicMap, ({ one }) => ({
  condition: one(conditions, { fields: [conditionTopicMap.conditionId], references: [conditions.id] }),
  topic: one(topics, { fields: [conditionTopicMap.topicId], references: [topics.id] }),
}));

export const conditionDirectTriggersRelations = relations(conditionDirectTriggers, ({ one }) => ({
  condition: one(conditions, { fields: [conditionDirectTriggers.conditionId], references: [conditions.id] }),
  answerOption: one(answerOptions, { fields: [conditionDirectTriggers.answerOptionId], references: [answerOptions.id] }),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, { fields: [assessments.userId], references: [users.id] }),
  answers: many(assessmentAnswers),
  topicScores: many(topicScores),
  assessmentConditions: many(assessmentConditions),
}));

export const assessmentAnswersRelations = relations(assessmentAnswers, ({ one }) => ({
  assessment: one(assessments, { fields: [assessmentAnswers.assessmentId], references: [assessments.id] }),
  topic: one(topics, { fields: [assessmentAnswers.topicId], references: [topics.id] }),
  question: one(questions, { fields: [assessmentAnswers.questionId], references: [questions.id] }),
  option: one(answerOptions, { fields: [assessmentAnswers.optionId], references: [answerOptions.id] }),
}));

export const topicScoresRelations = relations(topicScores, ({ one }) => ({
  assessment: one(assessments, { fields: [topicScores.assessmentId], references: [assessments.id] }),
  topic: one(topics, { fields: [topicScores.topicId], references: [topics.id] }),
}));

export const assessmentConditionsRelations = relations(assessmentConditions, ({ one }) => ({
  assessment: one(assessments, { fields: [assessmentConditions.assessmentId], references: [assessments.id] }),
  condition: one(conditions, { fields: [assessmentConditions.conditionId], references: [conditions.id] }),
}));

export const expertNotesRelations = relations(expertNotes, ({ one }) => ({
  expert: one(users, { fields: [expertNotes.expertId], references: [users.id], relationName: "expertNotes" }),
  user: one(users, { fields: [expertNotes.userId], references: [users.id], relationName: "userNotes" }),
}));

export const securityLogsRelations = relations(securityLogs, ({ one }) => ({
  user: one(users, { fields: [securityLogs.userId], references: [users.id] }),
}));

// ── Type exports ──────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type AnswerOption = typeof answerOptions.$inferSelect;
export type NewAnswerOption = typeof answerOptions.$inferInsert;
export type Condition = typeof conditions.$inferSelect;
export type NewCondition = typeof conditions.$inferInsert;
export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
export type AssessmentAnswer = typeof assessmentAnswers.$inferSelect;
export type NewAssessmentAnswer = typeof assessmentAnswers.$inferInsert;
export type TopicScore = typeof topicScores.$inferSelect;
export type AssessmentCondition = typeof assessmentConditions.$inferSelect;
export type Clinician = typeof clinicians.$inferSelect;
export type NewClinician = typeof clinicians.$inferInsert;
export type ExpertNote = typeof expertNotes.$inferSelect;
export type SecurityLog = typeof securityLogs.$inferSelect;
