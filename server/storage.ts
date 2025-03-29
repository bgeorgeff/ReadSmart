import { users, type User, type InsertUser, type TextSummary, type InsertTextSummary, type Recording, type InsertRecording } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private textSummaries: Map<number, TextSummary>;
  private recordings: Map<number, Recording>;
  private userCurrentId: number;
  private textSummaryCurrentId: number;
  private recordingCurrentId: number;

  constructor() {
    this.users = new Map();
    this.textSummaries = new Map();
    this.recordings = new Map();
    this.userCurrentId = 1;
    this.textSummaryCurrentId = 1;
    this.recordingCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async saveTextSummary(insertTextSummary: InsertTextSummary): Promise<TextSummary> {
    const id = this.textSummaryCurrentId++;
    const textSummary: TextSummary = { ...insertTextSummary, id };
    this.textSummaries.set(id, textSummary);
    return textSummary;
  }
  
  async getTextSummary(id: number): Promise<TextSummary | undefined> {
    return this.textSummaries.get(id);
  }
  
  async saveRecording(insertRecording: InsertRecording): Promise<Recording> {
    const id = this.recordingCurrentId++;
    const recording: Recording = { ...insertRecording, id };
    this.recordings.set(id, recording);
    return recording;
  }
  
  async getRecording(id: number): Promise<Recording | undefined> {
    return this.recordings.get(id);
  }
  
  async getRecordingsBySummaryId(summaryId: number): Promise<Recording[]> {
    return Array.from(this.recordings.values()).filter(
      (recording) => recording.summaryId === summaryId
    );
  }
}

export const storage = new MemStorage();
