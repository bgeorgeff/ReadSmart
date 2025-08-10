import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// New schema for text processing
export const textSummaries = pgTable("text_summaries", {
  id: serial("id").primaryKey(),
  originalText: text("original_text").notNull(),
  summaries: jsonb("summaries").notNull(), // Store all 12 grade-level summaries
  createdAt: text("created_at").notNull(), // ISO string date
});

export const insertTextSummarySchema = createInsertSchema(textSummaries).pick({
  originalText: true,
  summaries: true,
  createdAt: true,
});

export type InsertTextSummary = z.infer<typeof insertTextSummarySchema>;
export type TextSummary = typeof textSummaries.$inferSelect;

// Schema for recordings
export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(), 
  summaryId: integer("summary_id").notNull(),
  audioUrl: text("audio_url").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertRecordingSchema = createInsertSchema(recordings).pick({
  summaryId: true,
  audioUrl: true,
  createdAt: true,
});

export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordings.$inferSelect;

// Schema for validating text processing request
export const processTextSchema = z.object({
  text: z.string().min(1, "Text cannot be empty"),
  gradeLevel: z.number().min(1).max(12).optional(),
  outputType: z.enum(['summary', 'retelling']).optional()
});

// Schema for grade level summary response
export const gradeLevelSummarySchema = z.object({
  gradeLevel: z.number().min(1).max(12),
  summaryId: z.number(),
});

// Schema for word detail request
export const wordDetailSchema = z.object({
  word: z.string().min(1, "Word is required"),
});

// Schema for saving recording request
export const saveRecordingSchema = z.object({
  summaryId: z.number(),
  audioData: z.string(), // Base64 encoded audio data
});

// Beta Users Schema - matching your exact PostgreSQL table structure
export const betaUsers = pgTable("beta_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  signupDate: text("signup_date").notNull(), // timestamp as text
  status: text("status").default('active'),
});

export const insertBetaUserSchema = createInsertSchema(betaUsers).pick({
  email: true,
  signupDate: true,
  status: true,
});

export type InsertBetaUser = z.infer<typeof insertBetaUserSchema>;
export type BetaUser = typeof betaUsers.$inferSelect;

// Feedback Schema - matching your exact PostgreSQL table structure
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  feedbackType: text("feedback_type").default('General Feedback'),
  message: text("message").notNull(),
  hasScreenshot: boolean("has_screenshot").default(false),
  date: text("date").notNull(), // timestamp as text
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  userEmail: true,
  feedbackType: true,
  message: true,
  hasScreenshot: true,
  date: true,
});

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

// Beta Signup Form Schema
export const betaSignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  userType: z.enum(["teacher", "student", "parent", "other"]),
  organization: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

// Feedback Form Schema
export const feedbackFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  feedbackType: z.enum(["bug", "feature", "improvement", "other"]),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  rating: z.number().min(1).max(5).optional(),
});