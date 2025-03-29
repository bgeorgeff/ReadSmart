import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateGradeLevelSummaries } from "./utils/openai";
import { breakWordIntoSyllables } from "./utils/syllable";
import { processTextSchema, gradeLevelSummarySchema, wordDetailSchema, saveRecordingSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // process text and generate summaries for all grade levels
  app.post("/api/process-text", async (req, res) => {
    try {
      const { text } = processTextSchema.parse(req.body);
      
      // Generate summaries for all grade levels
      const summaries = await generateGradeLevelSummaries(text);
      
      // Save the summaries
      const textSummary = await storage.saveTextSummary({
        originalText: text,
        summaries,
        createdAt: new Date().toISOString()
      });
      
      res.json({
        success: true,
        summaryId: textSummary.id,
        summaries
      });
    } catch (error) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        console.error("Error processing text:", error);
        res.status(500).json({ 
          success: false, 
          message: "Error processing text: " + (error instanceof Error ? error.message : String(error))
        });
      }
    }
  });
  
  // Get a summary for a specific grade level
  app.get("/api/summary/:id/:gradeLevel", async (req, res) => {
    try {
      const { id, gradeLevel } = req.params;
      const result = gradeLevelSummarySchema.parse({
        summaryId: parseInt(id, 10),
        gradeLevel: parseInt(gradeLevel, 10)
      });
      
      const textSummary = await storage.getTextSummary(result.summaryId);
      
      if (!textSummary) {
        return res.status(404).json({ success: false, message: "Summary not found" });
      }
      
      const gradeLevelSummary = textSummary.summaries[result.gradeLevel];
      
      if (!gradeLevelSummary) {
        return res.status(404).json({ success: false, message: "Grade level summary not found" });
      }
      
      res.json({
        success: true,
        summary: gradeLevelSummary,
        gradeLevel: result.gradeLevel
      });
    } catch (error) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        console.error("Error fetching summary:", error);
        res.status(500).json({ 
          success: false, 
          message: "Error fetching summary: " + (error instanceof Error ? error.message : String(error))
        });
      }
    }
  });
  
  // Get word syllables
  app.get("/api/word/:word", async (req, res) => {
    try {
      const { word } = wordDetailSchema.parse({ word: req.params.word });
      
      // Break the word into syllables
      const syllables = breakWordIntoSyllables(word);
      
      res.json({
        success: true,
        word,
        syllables,
        pronunciation: word // In a production env, we'd use a proper pronunciation API
      });
    } catch (error) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        console.error("Error processing word:", error);
        res.status(500).json({ 
          success: false, 
          message: "Error processing word: " + (error instanceof Error ? error.message : String(error))
        });
      }
    }
  });
  
  // Save a recording
  app.post("/api/recordings", async (req, res) => {
    try {
      const { summaryId, audioData } = saveRecordingSchema.parse(req.body);
      
      // In a real implementation, we would save the audio data to a storage service
      // Here we'll just save the reference in memory
      
      const recording = await storage.saveRecording({
        summaryId,
        audioUrl: `recording_${Date.now()}.wav`, // This would be a real URL in production
        createdAt: new Date().toISOString()
      });
      
      res.json({
        success: true,
        recordingId: recording.id
      });
    } catch (error) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        console.error("Error saving recording:", error);
        res.status(500).json({ 
          success: false, 
          message: "Error saving recording: " + (error instanceof Error ? error.message : String(error))
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
