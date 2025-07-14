import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateGradeLevelSummaries, testApiConnection, shortenText } from "./utils/openai";
import { breakWordIntoSyllables } from "./utils/syllable";
import { breakWordIntoSyllablesV2 } from "./utils/syllable-v2/core";
import { processTextSchema, gradeLevelSummarySchema, wordDetailSchema, saveRecordingSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
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
  // Process text and generate summaries for all grade levels
  app.post("/api/process-text", async (req, res) => {
    try {
      const { text } = processTextSchema.parse(req.body);

      // Check text length and automatically shorten if needed
      const wordCount = text.split(/\s+/).length;
      const charCount = text.length;
      const maxWords = 650;
      const maxChars = 3772;

      let processedText = text;

      // If text exceeds limits, shorten it transparently
      if (wordCount > maxWords || charCount > maxChars) {
        console.log(`Text exceeds limits (${wordCount} words, ${charCount} chars). Shortening automatically...`);
        processedText = await shortenText(text, maxWords, maxChars);

        const newWordCount = processedText.split(/\s+/).length;
        const newCharCount = processedText.length;
        console.log(`Text shortened to ${newWordCount} words, ${newCharCount} chars`);
      }

      // Generate summaries for all grade levels using the processed text
      const summaries = await generateGradeLevelSummaries(processedText);

      // Save the summaries with the processed text (not the original if it was shortened)
      const textSummary = await storage.saveTextSummary({
        originalText: processedText,
        summaries: summaries,
        createdAt: new Date().toISOString()
      });

      res.json({
        success: true,
        summaryId: textSummary.id,
        summaries: summaries
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
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        console.error('[Word Detail] Error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch word details. Please try again.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
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