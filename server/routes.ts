import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateGradeLevelSummaries, testApiConnection } from "./utils/openai";
import { breakWordIntoSyllables } from "./utils/syllable";
import { processTextSchema, gradeLevelSummarySchema, wordDetailSchema, saveRecordingSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import OpenAI from "openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug route to test API connectivity
  app.get("/api/debug/test-api", async (req, res) => {
    try {
      const result = await testApiConnection();
      res.json({
        success: true,
        message: "API connection test successful",
        result
      });
    } catch (error) {
      console.error("API connection test failed:", error);
      res.status(500).json({
        success: false,
        message: "API connection test failed: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });
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
  
  // Get word details
  app.get("/api/word/:word", async (req, res) => {
    try {
      const { word } = wordDetailSchema.parse({ word: req.params.word });
      
      // Generate word definition and example sentence
      // In a production environment, this would call a dictionary API or language model
      
      let definition = "";
      let exampleSentence = "";
      
      try {
        // Use OpenAI to generate definition and example sentence
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY
        });
        
        const prompt = `Please provide a short definition and example sentence for the word "${word}". 
                        Format the response as a JSON object with two fields: 
                        "definition" (a brief, clear definition appropriate for students) and 
                        "exampleSentence" (a simple, clear sentence using the word correctly).`;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        });
        
        const result = JSON.parse(response.choices[0].message.content);
        definition = result.definition;
        exampleSentence = result.exampleSentence;
      } catch (apiError) {
        console.error("API error:", apiError);
        // Fallback definitions if API call fails
        definition = `Definition for the word "${word}"`;
        exampleSentence = `This is an example sentence using the word "${word}".`;
      }
      
      res.json({
        success: true,
        word,
        pronunciation: word, // In a production env, we'd use a proper pronunciation API
        definition,
        exampleSentence
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
