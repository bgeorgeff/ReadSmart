import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, textSummaries, recordings, betaUsers, feedback } from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, {
  schema: { users, textSummaries, recordings, betaUsers, feedback }
});

// Function to create the beta_users and feedback tables with your exact specifications
export async function createBetaFeedbackTables() {
  try {
    console.log("Creating beta_users and feedback tables...");
    
    // Create beta_users table with your specifications
    await sql`
      CREATE TABLE IF NOT EXISTS beta_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        signup_date TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'active'
      )
    `;
    
    // Create feedback table with your specifications  
    await sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        feedback_type VARCHAR(100) DEFAULT 'General Feedback',
        message TEXT NOT NULL,
        has_screenshot BOOLEAN DEFAULT FALSE,
        date TIMESTAMP NOT NULL
      )
    `;
    
    console.log("✅ Beta and feedback tables created successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

// Function to run table creation once
export async function initializeDatabase() {
  try {
    await createBetaFeedbackTables();
    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}