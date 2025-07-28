import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
  defaultHeaders: process.env.OPENROUTER_API_KEY 
    ? {
        "HTTP-Referer": "https://replit.com/", // Required by OpenRouter
        "X-Title": "TextSimplifier App"
      } 
    : {}
});

// Function to generate summaries for different grade levels
export async function generateGradeLevelSummaries(text: string): Promise<Record<number, string>> {
  try {
    // Define the system prompt for the model
    const systemPrompt = `
      You are an educational AI assistant that specializes in simplifying text for different grade levels.
      Your task is to summarize the provided text at 12 different grade levels (1st through 12th grade).
      For each grade level, maintain the key concepts but adjust vocabulary, sentence length, and complexity to be appropriate for that grade level.
      For lower grades (1-3), use simple words, short sentences, and focus on concrete concepts.
      For middle grades (4-8), gradually introduce more complex vocabulary and sentence structures, while still maintaining clarity.
      For higher grades (9-12), include more abstract concepts, sophisticated vocabulary, and nuanced explanations.

      IMPORTANT: When handling technical terms (like "null", "undefined", "true", "false", HTTP codes, etc.):
      - Keep the technical term exactly as written in the original text (same case, no quotes)
      - For lower grades, you may add simple explanations AFTER the term, but never duplicate or modify the term itself
      - Never wrap technical terms in quotes unless they were already quoted in the original
      - Example: "undefined" should stay "undefined", not become "'undefined'" or "undefined undefined"

      Ensure each summary is accurate, educational, and tailored appropriately for the cognitive and reading abilities of students at that grade level.

      CRITICAL: You must provide complete summaries for ALL 12 grade levels (1 through 12). Do not truncate or leave any summaries incomplete.
      Each summary should be 2-4 sentences long to ensure they fit within token limits while being complete.

      Respond with a valid JSON object where the keys are grade level numbers (1-12) and the values are the corresponding complete summaries.
    `;

    // Define the model to use based on available API keys
    const model = process.env.OPENROUTER_API_KEY ? "anthropic/claude-sonnet-4" : "gpt-4";

    // Make the API request
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.7,
      max_tokens: 4000, // Increased to accommodate all 12 summaries
      response_format: { type: "json_object" } // Explicitly request JSON formatting
    });

    // Get the generated content
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from API");
    }

    // Try to extract JSON from the response, handling potential issues
    try {
      // Clean up the response to ensure valid JSON
      let jsonContent = content;

      // Extract JSON object if wrapped in other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      // Handle incomplete JSON by trying to fix common truncation issues
      if (!jsonContent.endsWith('}')) {
        // Find the last complete entry and close the JSON
        const lastCompleteQuote = jsonContent.lastIndexOf('"');
        if (lastCompleteQuote > 0) {
          jsonContent = jsonContent.substring(0, lastCompleteQuote + 1) + '}';
        } else {
          jsonContent += '}';
        }
      }

      // Parse the JSON response
      const summaries = JSON.parse(jsonContent);

      // Normalize quote characters in all summaries
      Object.keys(summaries).forEach(key => {
        if (typeof summaries[key] === 'string') {
          summaries[key] = summaries[key]
            .replace(/[""]/g, '"')  // Replace smart double quotes with regular double quotes
            .replace(/['']/g, "'"); // Replace smart single quotes with regular single quotes
        }
      });

      // Validate the structure of the response - ensure we have all grade levels
      const expectedGradeLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const missingLevels = expectedGradeLevels.filter(level => !summaries[level]);

      if (missingLevels.length > 0) {
        console.warn(`API response missing grade levels: ${missingLevels.join(', ')}`);

        // Fill in missing levels with placeholders to prevent app crashes
        missingLevels.forEach(level => {
          summaries[level] = `Summary for grade ${level} is being generated...`;
        });
      }

      return summaries;
    } catch (error) {
      const jsonError = error as Error;
      console.error("Error parsing JSON response:", jsonError);
      console.error("Response content:", content);

      // Generate a fallback response to prevent application crash
      const fallbackSummaries: Record<number, string> = {};
      for (let i = 1; i <= 12; i++) {
        fallbackSummaries[i] = "We encountered an issue generating this summary. Please try again with a different text.";
      }

      // Return the fallback summaries
      return fallbackSummaries;
    }
  } catch (error) {
    console.error("Error generating summaries:", error);
    throw error;
  }
}

// Function to intelligently shorten text while maintaining reading level and key information
export async function shortenText(text: string, maxWords: number = 650, maxChars: number = 3772): Promise<string> {
  try {
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;

    // If text is within limits, return as-is
    if (wordCount <= maxWords && charCount <= maxChars) {
      return text;
    }

    const systemPrompt = `
      You are an expert text editor. Your task is to shorten the provided text while:
      1. Maintaining the original reading level and writing style
      2. Preserving all key information, main points, and important details
      3. Keeping the same tone, voice, and technical vocabulary
      4. Ensuring the shortened text flows naturally and coherently
      5. Maintaining any technical terms, proper nouns, or specialized language exactly as written

      The shortened text should be close to but not exceed ${maxWords} words and ${maxChars} characters (including spaces and punctuation).

      Aim for approximately ${Math.floor(maxWords * 0.9)}-${maxWords} words to retain maximum detail while staying within limits.
      Focus on removing redundant phrases, overly descriptive language, and less critical supporting details while keeping all essential information intact.

      Return only the shortened text without any explanation or commentary.
    `;

    const model = process.env.OPENROUTER_API_KEY ? "openai/gpt-4-turbo" : "gpt-4o"; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.3, // Lower temperature for more consistent editing
      max_tokens: Math.min(2000, maxWords * 2) // Ensure we don't exceed reasonable token limits
    });

    const shortenedText = response.choices[0].message.content?.trim();
    if (!shortenedText) {
      throw new Error("Empty response from text shortening API");
    }

    // Verify the shortened text meets our requirements
    const shortWordCount = shortenedText.split(/\s+/).length;
    const shortCharCount = shortenedText.length;

    if (shortWordCount <= maxWords && shortCharCount <= maxChars) {
      return shortenedText;
    } else {
      // If still too long, do a more precise shortening
      const aggressivePrompt = `
        The previous shortening was still too long. Please shorten this text to exactly ${maxWords} words or fewer and ${maxChars} characters or fewer.
        Aim for ${Math.floor(maxWords * 0.95)}-${maxWords} words to maximize detail retention while meeting the requirements.
        Keep as much essential information as possible while staying within limits.

        Text to shorten further: ${shortenedText}
      `;

      const aggressiveResponse = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: aggressivePrompt }
        ],
        temperature: 0.3,
        max_tokens: Math.min(1500, maxWords * 1.5)
      });

      return aggressiveResponse.choices[0].message.content?.trim() || shortenedText;
    }
  } catch (error) {
    console.error("Error shortening text:", error);
    // If shortening fails, truncate to character limit as fallback
    return text.substring(0, maxChars).trim();
  }
}

// Function to generate text for a specific grade level and output type
export async function generateSingleGradeLevelText(
  text: string, 
  gradeLevel: number, 
  outputType: 'summary' | 'retelling'
): Promise<string> {
  try {
    // Define the system prompt for the model
    const systemPrompt = `
      You are an educational AI assistant that specializes in creating age-appropriate content for dyslexic teens and adults, who are reading well below their expected grade levels.

      CRITICAL: You are writing for ADULTS who read at a ${gradeLevel}${getGradeSuffix(gradeLevel)} grade level, NOT for children. 
      The content should be:
      - Appropriate for adult interests and maturity
      - Written at a ${gradeLevel}${getGradeSuffix(gradeLevel)} grade reading level
      - Respectful and dignified for adult readers
      - Free of condescending or childish language

      Your task is to create a ${outputType} of the provided text.

      ${outputType === 'summary' ? 
        'A SUMMARY should condense the key points and main ideas into a shorter version while maintaining the essential information.' :
        'A RETELLING should present the complete narrative or content adapted to the reading level, NOT as a summary or book report. Preserve the original structure including:\n- Use dialogue when dialogue is spoken, but simplified to the appropriate grade level\n- Put in natural paragraph breaks and line spacing for dialogue\n- The natural flow and pacing of the original text\n- Maintain the story/narrative format rather than "this happened, then this happened" reporting style'
      }

      For ${gradeLevel}${getGradeSuffix(gradeLevel)} grade level:
      ${getGradeLevelGuidelines(gradeLevel)}

      IMPORTANT FORMATTING AND CONTENT RULES:
      - When handling technical terms, proper nouns, or specialized vocabulary: keep them exactly as written
      - You may add simple explanations after technical terms if needed for lower grades
      - Never duplicate or modify the terms themselves
      - Maintain the dignity and adult-appropriate nature of the content

      FOR RETELLINGS SPECIFICALLY:
      - Preserve all dialogue using quotation marks exactly as in the original
      - Add natural paragraph breaks and line spacing throughout the text
      - Retell the story and preserve the natural narrative flow rather than creating a report-style summary
      - Adapt vocabulary and sentence complexity to the grade level while preserving the story structure
      - Insert double line breaks (\\n\\n) between distinct paragraphs and sections to preserve readable formatting

      CRITICAL DIALOGUE FORMATTING RULES - FOLLOW EXACTLY:
      - ALWAYS preserve dialogue with quotation marks: "Hello," she said.
      - MANDATORY: Each speaker gets their own paragraph with a line break before and after
      - MANDATORY: When dialogue switches between different characters, you MUST insert a blank line between speakers
      - EXACT FORMAT REQUIRED:

        Mrs. Bennet said, "We have a new neighbor!"

        Mr. Bennet replied, "That is interesting news."

        "He is very rich," she continued.

      - NEVER put two different speakers' dialogue in the same paragraph
      - ALWAYS add line breaks (\\n\\n) before each new speaker
      - Each line of dialogue should be separated by double line breaks for readability

      Respond with only the ${outputType}, no additional commentary or explanation.
    `;

    // Define the model to use based on available API keys
    const model = process.env.OPENROUTER_API_KEY ? "anthropic/claude-sonnet-4" : "gpt-4";

    // Make the API request
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    // Get the generated content
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from API");
    }

    // Clean up word duplications and normalize quotes
    let cleanedContent = content
      .replace(/[""]/g, '"')  // Replace smart double quotes with regular double quotes
      .replace(/['']/g, "'") // Replace smart single quotes with regular single quotes
      // Fix merged words like "said Mrssaid" → "said Mrs."
      .replace(/\b(\w+)\s+(\w+)(\w+)\./g, (match, word1, word2, word3) => {
        // Check if word2+word3 contains word2 at the start (like "Mrssaid" contains "Mrs")
        const combined = word2 + word3;
        if (combined.toLowerCase().startsWith(word2.toLowerCase()) && combined.length > word2.length) {
          return `${word1} ${word2}.`;
        }
        return match;
      })
      // Fix word duplications like "daughters daughters" → "daughters"
      .replace(/\b(\w+)\s+\1\b/gi, '$1')
      // Fix word duplications with punctuation like "asked asked." → "asked."
      .replace(/\b(\w+)\s+\1([.,!?;:])/gi, '$1$2')
      // Fix word duplications around dialogue like "said said." → "said."
      .replace(/\b(said|asked|replied|answered)\s+\1([.,!?;:])/gi, '$1$2')
      // Fix quote-related duplications like "Bennet"Bennet → "Bennet"
      .replace(/"([^"]+)"([A-Za-z]+)/g, (match, quote, duplicate) => {
        const lastWordInQuote = quote.split(/\s+/).pop()?.toLowerCase();
        if (lastWordInQuote === duplicate.toLowerCase()) {
          return `"${quote}"`;
        }
        return match;
      });

    return cleanedContent;

  } catch (error) {
    console.error("Error generating single grade level text:", error);
    throw error;
  }
}

// Helper function to get grade suffix (1st, 2nd, 3rd, etc.)
function getGradeSuffix(grade: number): string {
  if (grade === 1) return 'st';
  if (grade === 2) return 'nd';
  if (grade === 3) return 'rd';
  return 'th';
}

// Helper function to get grade-level specific guidelines
function getGradeLevelGuidelines(grade: number): string {
  if (grade <= 3) {
    return `
      - Use simple, common words (avoid words longer than 2-3 syllables when possible)
      - Keep sentences short (10-15 words maximum)
      - Focus on concrete concepts and actions
      - Use simple sentence structures (subject-verb-object)
    `;
  } else if (grade <= 6) {
    return `
      - Use moderately complex vocabulary with some longer words
      - Sentences can be 15-20 words
      - Include some compound sentences
      - Introduce more abstract concepts with concrete examples
    `;
  } else if (grade <= 9) {
    return `
      - Use grade-appropriate vocabulary including some advanced terms
      - Sentences can be 20-25 words
      - Use complex sentence structures including dependent clauses
      - Handle abstract concepts and nuanced ideas
    `;
  } else {
    return `
      - Use sophisticated vocabulary appropriate for the content
      - Sentences can be longer and more complex
      - Include advanced sentence structures and rhetorical devices
      - Handle complex abstract concepts and nuanced analysis
    `;
  }
}

// Function to test the API connection
export async function testApiConnection() {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENROUTER_API_KEY ? "openai/gpt-3.5-turbo" : "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Hello, please reply with the word 'Connected' to confirm connectivity." }
      ],
      max_tokens: 10
    });

    return {
      status: "success",
      model: response.model,
      content: response.choices[0].message.content
    };
  } catch (error) {
    console.error("API test error:", error);
    throw error;
  }
}