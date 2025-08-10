import { users, textSummaries, recordings, betaUsers, feedback, type User, type InsertUser, type TextSummary, type InsertTextSummary, type Recording, type InsertRecording, type BetaUser, type InsertBetaUser, type Feedback, type InsertFeedback } from "@shared/schema";
import { db } from "./database";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Text summary methods
  saveTextSummary(textSummary: InsertTextSummary): Promise<TextSummary>;
  getTextSummary(id: number): Promise<TextSummary | undefined>;
  
  // Recording methods
  saveRecording(recording: InsertRecording): Promise<Recording>;
  getRecording(id: number): Promise<Recording | undefined>;
  getRecordingsBySummaryId(summaryId: number): Promise<Recording[]>;
  
  // Beta user methods
  createBetaUser(betaUser: InsertBetaUser): Promise<BetaUser>;
  getBetaUser(id: number): Promise<BetaUser | undefined>;
  getBetaUserByEmail(email: string): Promise<BetaUser | undefined>;
  getAllBetaUsers(): Promise<BetaUser[]>;
  
  // Feedback methods
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedback(id: number): Promise<Feedback | undefined>;
  getAllFeedback(): Promise<Feedback[]>;
}



// PostgreSQL Storage Implementation

export class PostgreSQLStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async saveTextSummary(textSummary: InsertTextSummary): Promise<TextSummary> {
    const result = await db.insert(textSummaries).values(textSummary).returning();
    return result[0];
  }

  async getTextSummary(id: number): Promise<TextSummary | undefined> {
    const result = await db.select().from(textSummaries).where(eq(textSummaries.id, id)).limit(1);
    return result[0];
  }

  async saveRecording(recording: InsertRecording): Promise<Recording> {
    const result = await db.insert(recordings).values(recording).returning();
    return result[0];
  }

  async getRecording(id: number): Promise<Recording | undefined> {
    const result = await db.select().from(recordings).where(eq(recordings.id, id)).limit(1);
    return result[0];
  }

  async getRecordingsBySummaryId(summaryId: number): Promise<Recording[]> {
    return await db.select().from(recordings).where(eq(recordings.summaryId, summaryId));
  }

  // Beta user methods
  async createBetaUser(betaUser: InsertBetaUser): Promise<BetaUser> {
    const result = await db.insert(betaUsers).values(betaUser).returning();
    return result[0];
  }

  async getBetaUser(id: number): Promise<BetaUser | undefined> {
    const result = await db.select().from(betaUsers).where(eq(betaUsers.id, id)).limit(1);
    return result[0];
  }

  async getBetaUserByEmail(email: string): Promise<BetaUser | undefined> {
    const result = await db.select().from(betaUsers).where(eq(betaUsers.email, email)).limit(1);
    return result[0];
  }

  async getAllBetaUsers(): Promise<BetaUser[]> {
    return await db.select().from(betaUsers);
  }

  // Feedback methods
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const result = await db.insert(feedback).values(feedbackData).returning();
    return result[0];
  }

  async getFeedback(id: number): Promise<Feedback | undefined> {
    const result = await db.select().from(feedback).where(eq(feedback.id, id)).limit(1);
    return result[0];
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedback);
  }
}

export const storage = new PostgreSQLStorage();
