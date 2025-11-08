import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateGradeLevelSummaries, testApiConnection, shortenText, generateSingleGradeLevelText } from "./utils/openai";
import { breakWordIntoSyllables } from "./utils/syllable";
import { breakWordIntoSyllablesV2 } from "./utils/syllable-v2/core";
import { processTextSchema, gradeLevelSummarySchema, wordDetailSchema, saveRecordingSchema, betaSignupSchema, feedbackFormSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug endpoint to test API connectivity
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Serve the syllable test page
  app.get("/syllable-test.html", (req, res) => {
    const filePath = path.join(__dirname, "..", "syllable-test.html");
    res.sendFile(filePath);
  });

  // Serve the audio test page
  app.get("/audio-test.html", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Audio Recorder Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        button {
            padding: 12px 24px;
            margin: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .record-btn {
            background-color: #ff4444;
            color: white;
        }
        .record-btn:hover {
            background-color: #cc3333;
        }
        .play-btn {
            background-color: #4CAF50;
            color: white;
        }
        .play-btn:hover {
            background-color: #45a049;
        }
        .status {
            margin: 20px 0;
            padding: 10px;
            border-radius: 5px;
            background-color: #e7f3ff;
        }
        .time {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Simple Audio Recorder Test</h1>
        <p>This is a standalone test to check if basic audio recording and playback works.</p>

        <div class="status">
            <div id="status">Ready to record</div>
            <div class="time" id="timer">00:00</div>
        </div>

        <button id="recordBtn" class="record-btn">🎤 Start Recording</button>
        <button id="playBtn" class="play-btn" disabled>▶️ Play Recording</button>

        <audio id="audioPlayer" controls style="width: 100%; margin-top: 20px;" hidden></audio>
    </div>

    <script>
        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;
        let recordingTime = 0;
        let timer;

        const recordBtn = document.getElementById('recordBtn');
        const playBtn = document.getElementById('playBtn');
        const status = document.getElementById('status');
        const timerDisplay = document.getElementById('timer');
        const audioPlayer = document.getElementById('audioPlayer');

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
        }

        async function startRecording() {
            try {
                console.log('Requesting microphone access...');
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('Got microphone access');

                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                recordingTime = 0;

                console.log('MediaRecorder created:', mediaRecorder.mimeType);

                mediaRecorder.ondataavailable = event => {
                    console.log('Data available:', event.data.size, 'bytes');
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    console.log('Recording stopped, chunks:', audioChunks.length);
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    console.log('Created blob:', audioBlob.size, 'bytes');

                    const audioUrl = URL.createObjectURL(audioBlob);
                    console.log('Created URL:', audioUrl);

                    audioPlayer.src = audioUrl;
                    audioPlayer.hidden = false;
                    playBtn.disabled = false;

                    status.textContent = 'Recording ready for playback';

                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                isRecording = true;

                recordBtn.textContent = '⏹️ Stop Recording';
                recordBtn.className = 'record-btn';
                status.textContent = 'Recording...';
                playBtn.disabled = true;

                timer = setInterval(() => {
                    recordingTime++;
                    timerDisplay.textContent = formatTime(recordingTime);
                }, 1000);

            } catch (error) {
                console.error('Error starting recording:', error);
                status.textContent = 'Error: ' + error.message;
            }
        }

        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;

                recordBtn.textContent = '🎤 Start Recording';
                status.textContent = 'Processing recording...';

                clearInterval(timer);
            }
        }

        function playRecording() {
            console.log('Playing audio...');
            console.log('Audio player volume:', audioPlayer.volume);
            console.log('Audio player muted:', audioPlayer.muted);
            console.log('Audio player duration:', audioPlayer.duration);
            console.log('Audio player src:', audioPlayer.src);
            console.log('Audio player readyState:', audioPlayer.readyState);

            audioPlayer.play()
                .then(() => {
                    console.log('Audio playing successfully');
                    console.log('Current time:', audioPlayer.currentTime);
                    status.textContent = 'Playing recording...';
                })
                .catch(error => {
                    console.error('Error playing audio:', error);
                    status.textContent = 'Error playing audio: ' + error.message;
                });
        }

        recordBtn.addEventListener('click', () => {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });

        playBtn.addEventListener('click', playRecording);

        audioPlayer.addEventListener('ended', () => {
            status.textContent = 'Playback finished';
        });

        audioPlayer.addEventListener('play', () => {
            status.textContent = 'Playing recording...';
        });

        audioPlayer.addEventListener('pause', () => {
            status.textContent = 'Playback paused';
        });

        console.log('Audio recorder test loaded');
    </script>
</body>
</html>`);
  });

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
  // Extract text from URL
  app.post("/api/extract-url", async (req, res) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "URL is required" 
        });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (e) {
        return res.status(400).json({ 
          success: false, 
          message: "Please enter a valid URL" 
        });
      }

      // Import required libraries
      const { Readability } = await import('@mozilla/readability');
      const { JSDOM } = await import('jsdom');

      // Fetch the webpage
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      if (!response.ok) {
        return res.status(422).json({
          success: false,
          message: "There is an issue retrieving text from this URL. Please try copying/pasting the text instead."
        });
      }

      const html = await response.text();
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article || !article.textContent || article.textContent.trim().length < 50) {
        return res.status(422).json({
          success: false,
          message: "There is an issue retrieving text from this URL. Please try copying/pasting the text instead."
        });
      }

      // Clean up the extracted text:
      // 1. Replace multiple consecutive newlines with just two (paragraph break)
      // 2. Remove lines that are just whitespace
      // 3. Trim leading/trailing whitespace from each line
      const cleanedText = article.textContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n');

      res.json({
        success: true,
        text: cleanedText,
        title: article.title
      });

    } catch (error) {
      console.error("URL extraction error:", error);
      res.status(422).json({ 
        success: false, 
        message: "There is an issue retrieving text from this URL. Please try copying/pasting the text instead."
      });
    }
  });

  // Process text and generate summaries for all 12 grade levels
  app.post("/api/process-text", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Text is required and cannot be empty" 
        });
      }

      // Generate summaries for all 12 grade levels
      console.log('Generating summaries for all 12 grade levels...');
      const summaries = await generateGradeLevelSummaries(text);

      // Save all summaries with the original text
      const textSummary = await storage.saveTextSummary({
        originalText: text,
        summaries: summaries,
        createdAt: new Date().toISOString()
      });

      // Return grade 5 as the default processed text for display
      const processedText = summaries[5] || text;

      res.json({
        success: true,
        summaryId: textSummary.id,
        summaries: summaries,
        processedText: processedText
      });
    } catch (error) {
      console.error("Error processing text:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error processing text: " + (error instanceof Error ? error.message : String(error))
      });
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

      const summariesData = textSummary.summaries as Record<number, string>;
      const gradeLevelSummary = summariesData[result.gradeLevel];

      if (!gradeLevelSummary) {
        return res.status(404).json({ success: false, message: "Grade level summary not found" });
      }

      res.json({
        success: true,
        summary: gradeLevelSummary,
        gradeLevel: result.gradeLevel
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
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



  // Word detail endpoint
  app.get('/api/word/:word', async (req, res) => {
    try {
      const word = decodeURIComponent(req.params.word).toLowerCase().trim();

      if (!word) {
        return res.status(400).json({
          success: false,
          message: 'Word parameter is required'
        });
      }

      console.log(`[Word Detail] Looking up: "${word}"`);

      // Get syllables using V2 system with error handling
      let syllables = [];
      try {
        const { breakWordIntoSyllablesV2 } = await import('./utils/syllable-v2/core.js');
        syllables = await breakWordIntoSyllablesV2(word);
        console.log(`[Word Detail] Syllables for "${word}":`, syllables);
      } catch (syllableError) {
        console.error(`[Word Detail] Syllabification error for "${word}":`, syllableError);
        // Continue without syllables rather than failing completely
        syllables = [word]; // Fallback to whole word
      }

      // Generate word definition and example sentence
      // In a production environment, this would call a dictionary API or language model

      let definition = "";
      let exampleSentence = "";

      try {
        // Debug: Log which API we're using
        console.log(`[Word Detail] Using ${process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 'OpenAI'} API for word: ${word}`);
        
        // Use the same OpenAI client from utils/openai.ts to ensure consistency
        const { openai } = await import('./utils/openai.js');

        const prompt = `Please provide a short definition and example sentence for the word "${word}". 
                        Format the response as a JSON object with two fields: 
                        "definition" (a brief, clear definition appropriate for students) and 
                        "exampleSentence" (a simple, clear sentence using the word correctly).`;

        // Use consistent model selection with Claude 4.0 Sonnet via OpenRouter
        const model = process.env.OPENROUTER_API_KEY 
          ? "anthropic/claude-sonnet-4"
          : process.env.ANTHROPIC_API_KEY 
            ? "claude-sonnet-4-20250514"
            : "gpt-4o";
        
        console.log(`[Word Detail] Using model: ${model}`);

        const response = await openai.chat.completions.create({
          model,
          messages: [{ role: "user" as const, content: prompt }],
          response_format: { type: "json_object" as const },
          temperature: 0.3,
          max_tokens: 500
        });
        
        const messageContent = response.choices[0].message.content;
        if (!messageContent) {
          throw new Error("No response content received from OpenAI");
        }

        console.log(`[Word Detail] Raw response: ${messageContent.substring(0, 200)}...`);
        
        // Clean the response to handle markdown-wrapped JSON from Claude
        let cleanedContent = messageContent.trim();
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const result = JSON.parse(cleanedContent);
        definition = result.definition;
        exampleSentence = result.exampleSentence;
      } catch (apiError) {
        console.error("API error:", apiError);
        // Fallback definitions if API call fails
        definition = `Definition for the word "${word}"`;
        exampleSentence = `This is an example sentence using the word "${word}".`;
      }


      // Simple pronunciation (just the word for now)
      const pronunciation = word;

      const wordDetail = {
        success: true,
        word: word,
        pronunciation: word, // In a production env, we'd use a proper pronunciation API
        definition,
        exampleSentence,
        syllables
      };

      console.log(`[Word Detail] Successfully processed: "${word}"`);
      res.json(wordDetail);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        console.error('[Word Detail] Error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch word details. Please try again.',
          error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
        });
      }
    }
  });

  // Test endpoint for syllable V2
  app.get("/api/test-syllable-v2", async (req, res) => {
    try {
      const testWords = [
        'experience', 'revolutionary', 'international',
        'patience', 'musician', 'precious', 'special',
        'wanted', 'walked', 'approved', 'any', 'many'
      ];

      const results: any[] = [];

      // Dynamic import to avoid initialization issues
      const { breakWordIntoSyllablesV2 } = await import('./utils/syllable-v2/core.js');

      for (const word of testWords) {
        const syllables = await breakWordIntoSyllablesV2(word);
        results.push({
          word,
          syllables: syllables.join('-')
        });
      }

      res.json({ success: true, results });
    } catch (error) {
      console.error('Syllable V2 test error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
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
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
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

  // Beta signup endpoint using PostgreSQL pool.query()
  app.post("/api/beta-signup", async (req, res) => {
    try {
      const { pool } = await import("./db-pool");
      const { email } = req.body;
      
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid email is required" 
        });
      }

      // Check if email already exists
      const existingResult = await pool.query('SELECT id FROM beta_users WHERE email = $1', [email]);
      if (existingResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already registered for beta"
        });
      }

      // Insert new beta user
      const insertResult = await pool.query(
        'INSERT INTO beta_users (email, signup_date, status) VALUES ($1, $2, $3) RETURNING id',
        [email, new Date(), 'active']
      );

      res.json({
        success: true,
        message: "Welcome to the beta! Check your email for next steps.",
        userId: insertResult.rows[0].id
      });
    } catch (error) {
      console.error("Error in beta signup:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error signing up for beta: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });

  // Check beta status endpoint
  app.post('/api/check-beta-status', async (req, res) => {
    try {
      const { pool } = await import("./db-pool");
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const result = await pool.query(
        'SELECT * FROM beta_users WHERE email = $1',
        [email]
      );

      const isSignedUp = result.rows.length > 0;
      
      res.json({ 
        success: true, 
        isSignedUp,
        message: isSignedUp ? 'User is signed up for beta' : 'User not found'
      });
    } catch (error) {
      console.error('Error checking beta status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Feedback submission endpoint using PostgreSQL pool.query()
  app.post("/api/feedback", async (req, res) => {
    try {
      const { pool } = await import("./db-pool");
      const { user_email, feedback_type = 'General Feedback', message, has_screenshot = false } = req.body;
      
      if (!user_email || !message) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and message are required" 
        });
      }

      if (typeof message !== 'string' || message.trim().length < 10) {
        return res.status(400).json({ 
          success: false, 
          message: "Message must be at least 10 characters" 
        });
      }

      // Insert feedback
      const insertResult = await pool.query(
        'INSERT INTO feedback (user_email, feedback_type, message, has_screenshot, date) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user_email, feedback_type, message.trim(), has_screenshot, new Date()]
      );

      res.json({
        success: true,
        message: "Feedback submitted successfully!",
        feedbackId: insertResult.rows[0].id
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error submitting feedback: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });

  // Admin route: Get all beta users with feedback count
  app.get("/admin/users", async (req, res) => {
    try {
      const { pool } = await import("./db-pool");
      const result = await pool.query(`
        SELECT 
          bu.id,
          bu.email,
          bu.signup_date,
          bu.status,
          COUNT(f.id) as feedback_count
        FROM beta_users bu
        LEFT JOIN feedback f ON bu.email = f.user_email
        GROUP BY bu.id, bu.email, bu.signup_date, bu.status
        ORDER BY bu.signup_date DESC
      `);

      res.json({
        success: true,
        count: result.rows.length,
        users: result.rows
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error fetching users: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });

  // Admin route: Get all feedback (general endpoint)
  app.get("/admin/feedback", async (req, res) => {
    try {
      const { pool } = await import("./db-pool");
      const result = await pool.query('SELECT * FROM feedback ORDER BY date DESC');

      res.json({
        success: true,
        count: result.rows.length,
        feedback: result.rows
      });
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error fetching feedback: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });

  // Admin route: Delete a beta user
  app.delete("/admin/users/:id", async (req, res) => {
    try {
      const { pool } = await import("./db-pool");
      const userId = parseInt(req.params.id);
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "Valid user ID is required"
        });
      }

      const result = await pool.query('DELETE FROM beta_users WHERE id = $1 RETURNING *', [userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.json({
        success: true,
        message: "User deleted successfully",
        deletedUser: result.rows[0]
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error deleting user: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });

  // Admin route: Delete feedback
  app.delete("/admin/feedback/:id", async (req, res) => {
    try {
      const { pool } = await import("./db-pool");
      const feedbackId = parseInt(req.params.id);
      
      if (!feedbackId || isNaN(feedbackId)) {
        return res.status(400).json({
          success: false,
          message: "Valid feedback ID is required"
        });
      }

      const result = await pool.query('DELETE FROM feedback WHERE id = $1 RETURNING *', [feedbackId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found"
        });
      }

      res.json({
        success: true,
        message: "Feedback deleted successfully",
        deletedFeedback: result.rows[0]
      });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error deleting feedback: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });

  // Admin route: Get all feedback from a specific user
  app.get("/admin/feedback/:email", async (req, res) => {
    try {
      const { pool } = await import("./db-pool");
      const { email } = req.params;
      
      const result = await pool.query(
        'SELECT * FROM feedback WHERE user_email = $1 ORDER BY date DESC',
        [email]
      );

      res.json({
        success: true,
        email: email,
        count: result.rows.length,
        feedback: result.rows
      });
    } catch (error) {
      console.error("Error fetching user feedback:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error fetching user feedback: " + (error instanceof Error ? error.message : String(error))
      });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}