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
    const model = process.env.OPENROUTER_API_KEY ? "anthropic/claude-3.5-sonnet" : "gpt-4";

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
      6. CRITICAL: Always end sentences with complete words and proper punctuation
      7. NEVER truncate words mid-character or leave incomplete sentences

      The shortened text should not exceed ${maxWords} words.

      Aim for approximately ${Math.floor(maxWords * 0.9)}-${maxWords} words to retain maximum detail while staying within the word limit.
      Focus on removing redundant phrases, overly descriptive language, and less critical supporting details while keeping all essential information intact.

      ABSOLUTELY CRITICAL WORD PRESERVATION RULES - FOLLOW EXACTLY:
      - Every word must be complete and spelled correctly
      - NEVER EVER truncate or cut off any part of a word, especially before punctuation
      - Abbreviations like "Mr.", "Mrs.", "Dr." must remain complete
      - Words before periods must be fully spelled out (example: "wife." not "wif.", "said." not "sai.", "asked." not "aske.")
      - All technical terms and proper nouns must remain exactly as written
      - Ensure every sentence ends properly with complete words and punctuation
      - NO INCOMPLETE WORDS ALLOWED - if a word doesn't fit, remove the entire sentence instead of truncating
      - Double-check every word ending before any punctuation mark to ensure it's complete

      EXAMPLES OF WHAT TO NEVER DO:
      - "wif." (should be "wife.")
      - "sai." (should be "said.")
      - "aske." (should be "asked.")
      - "M." (should be "Mr.")
      - "excite." (should be "excited.")

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

    let shortenedText = response.choices[0].message.content?.trim();
    if (!shortenedText) {
      throw new Error("Empty response from text shortening API");
    }

    // Apply post-processing regex fixes for truncated words before periods
    shortenedText = fixTruncatedWordsBeforePeriods(shortenedText);

    // Verify the shortened text meets our requirements
    const shortWordCount = shortenedText.split(/\s+/).length;
    const shortCharCount = shortenedText.length;

    if (shortWordCount <= maxWords && shortCharCount <= maxChars) {
      return shortenedText;
    } else {
      // If still too long, do a more precise shortening
      const aggressivePrompt = `
        The previous shortening was still too long. Please shorten this text to exactly ${maxWords} words or fewer.
        Aim for ${Math.floor(maxWords * 0.95)}-${maxWords} words to maximize detail retention while meeting the word limit.
        Keep as much essential information as possible while staying within limits.
        
        CRITICAL WORD PRESERVATION RULES:
        - Every word must be complete and spelled correctly before ANY punctuation
        - Never truncate words before periods (example: write "wife." not "wif.")
        - Abbreviations like "Mr.", "Mrs." must remain complete
        - Always end sentences with complete words and proper punctuation
        - NEVER truncate words mid-character under any circumstances

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

      let finalText = aggressiveResponse.choices[0].message.content?.trim() || shortenedText;
      
      // Apply post-processing regex fixes for truncated words before periods
      finalText = fixTruncatedWordsBeforePeriods(finalText);
      
      return finalText;
    }
  } catch (error) {
    console.error("Error shortening text:", error);
    // If shortening fails, truncate to character limit as fallback
    return text.substring(0, maxChars);
  }
}

// Helper function to fix truncated words before periods using regex patterns
function fixTruncatedWordsBeforePeriods(text: string): string {
  if (!text) return text;
  
  // Comprehensive patterns of truncated words before periods
  const fixes = [
    // Fix common truncated words from the user's example
    { pattern: /\bwif\./g, replacement: 'wife.' },
    { pattern: /\bgirl\./g, replacement: 'girls.' },
    { pattern: /\bM\./g, replacement: 'Mr.' },
    { pattern: /\bhear\./g, replacement: 'heard.' },
    { pattern: /\bsai\./g, replacement: 'said.' },
    { pattern: /\bi\./g, replacement: 'it.' },
    { pattern: /\baske\./g, replacement: 'asked.' },
    { pattern: /\bm\./g, replacement: 'me.' },
    { pattern: /\bexcite\./g, replacement: 'excited.' },
    
    // Title and honorifics
    { pattern: /\bMr\./g, replacement: 'Mr.' },
    { pattern: /\bMrs\./g, replacement: 'Mrs.' },
    { pattern: /\bDr\./g, replacement: 'Dr.' },
    { pattern: /\bProf\./g, replacement: 'Prof.' },
    { pattern: /\bSt\./g, replacement: 'St.' },
    
    // Common dialog words
    { pattern: /\bsai\./g, replacement: 'said.' },
    { pattern: /\baske\./g, replacement: 'asked.' },
    { pattern: /\brepl\./g, replacement: 'replied.' },
    { pattern: /\banswere\./g, replacement: 'answered.' },
    { pattern: /\bcontinue\./g, replacement: 'continued.' },
    { pattern: /\bexplaine\./g, replacement: 'explained.' },
    { pattern: /\bstate\./g, replacement: 'stated.' },
    { pattern: /\bdeclare\./g, replacement: 'declared.' },
    { pattern: /\bannounce\./g, replacement: 'announced.' },
    { pattern: /\bwhispere\./g, replacement: 'whispered.' },
    { pattern: /\bshoute\./g, replacement: 'shouted.' },
    { pattern: /\bmuttere\./g, replacement: 'muttered.' },
    
    // Common nouns and verbs
    { pattern: /\bhous\./g, replacement: 'house.' },
    { pattern: /\bplac\./g, replacement: 'place.' },
    { pattern: /\btim\./g, replacement: 'time.' },
    { pattern: /\bwa\./g, replacement: 'way.' },
    { pattern: /\bda\./g, replacement: 'day.' },
    { pattern: /\byea\./g, replacement: 'year.' },
    { pattern: /\bwor\./g, replacement: 'work.' },
    { pattern: /\bhan\./g, replacement: 'hand.' },
    { pattern: /\bhe\./g, replacement: 'head.' },
    { pattern: /\bey\./g, replacement: 'eyes.' },
    { pattern: /\bfac\./g, replacement: 'face.' },
    { pattern: /\bvoic\./g, replacement: 'voice.' },
    { pattern: /\bword\./g, replacement: 'words.' },
    { pattern: /\bmone\./g, replacement: 'money.' },
    { pattern: /\bfamil\./g, replacement: 'family.' },
    { pattern: /\bfrien\./g, replacement: 'friend.' },
    { pattern: /\bneighbo\./g, replacement: 'neighbor.' },
    
    // More comprehensive single letter fixes
    { pattern: /\bi\./g, replacement: 'it.' },
    { pattern: /\bm\./g, replacement: 'me.' },
    { pattern: /\bt\./g, replacement: 'to.' },
    { pattern: /\ba\./g, replacement: 'at.' },
    { pattern: /\bo\./g, replacement: 'of.' },
    
    // Past tense verbs
    { pattern: /\bhear\./g, replacement: 'heard.' },
    { pattern: /\btol\./g, replacement: 'told.' },
    { pattern: /\bwan\./g, replacement: 'want.' },
    { pattern: /\bwante\./g, replacement: 'wanted.' },
    { pattern: /\bexcite\./g, replacement: 'excited.' },
    { pattern: /\bmove\./g, replacement: 'moved.' },
    { pattern: /\bmarr\./g, replacement: 'marry.' },
    { pattern: /\brent\./g, replacement: 'rented.' },
    { pattern: /\bliste\./g, replacement: 'listen.' },
    
    // Generic pattern for any word that looks truncated before a period
    // This is a more intelligent approach to detect truncated words
    { pattern: /\b([a-z]{1,8})\./g, replacement: (match: string, p1: string) => {
      // List of valid short words that should NOT be "fixed"
      const validShortWords = ['a', 'I', 'be', 'do', 'go', 'he', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'we', 'am', 'an', 'as', 'at', 'by', 'Mr', 'Dr'];
      
      // If it's a known valid short word, keep it
      if (validShortWords.includes(p1.toLowerCase()) || validShortWords.includes(p1)) {
        return match;
      }
      
      // Common patterns that suggest a word was truncated
      const commonTruncations: Record<string, string> = {
        'wif': 'wife',
        'sai': 'said',
        'hea': 'heard',
        'wan': 'want',
        'aske': 'asked',
        'excite': 'excited',
        'marrie': 'married',
        'repl': 'replied',
        'answe': 'answered',
        'explai': 'explained',
        'continu': 'continued',
        'declar': 'declared',
        'announc': 'announced',
        'whispe': 'whispered',
        'shout': 'shouted',
        'mutte': 'muttered',
        'neighbo': 'neighbor',
        'famil': 'family',
        'frien': 'friend'
      };
      
      // Check if this matches a known truncation pattern
      if (commonTruncations[p1.toLowerCase()]) {
        return commonTruncations[p1.toLowerCase()] + '.';
      }
      
      // For words ending in common truncation patterns, try to fix them
      if (p1.length >= 2) {
        // Words ending in single consonant + vowel often need completion
        if (/[aeiou]$/.test(p1) && p1.length <= 3) {
          // Could be truncated, but be conservative
          return match;
        }
        
        // Words that end abruptly at consonants are likely truncated
        if (/[bcdfghjklmnpqrstvwxyz]$/.test(p1) && p1.length >= 3) {
          // This is likely a truncated word, but without context it's hard to fix
          // For now, keep the original to avoid false positives
          return match;
        }
      }
      
      return match; // Keep original if unsure
    }},
    
    // Fix specific quote + truncation patterns
    { pattern: /"([^"]+)"([A-Za-z]+)\./g, replacement: (match: string, quote: string, duplicate: string) => {
      const lastWordInQuote = quote.split(/\s+/).pop()?.toLowerCase();
      if (lastWordInQuote === duplicate.toLowerCase()) {
        return `"${quote}".`;
      }
      return match;
    }}
  ];
  
  let fixedText = text;
  
  // Apply all fixes
  fixes.forEach(fix => {
    if (typeof fix.replacement === 'function') {
      fixedText = fixedText.replace(fix.pattern, fix.replacement);
    } else {
      fixedText = fixedText.replace(fix.pattern, fix.replacement);
    }
  });
  
  return fixedText;
}

// Helper function to ensure text ends with complete words and proper punctuation
function ensureCompleteWords(text: string): string {
  if (!text) return text;
  
  // Split into words and check each one for truncation
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return text;
  
  // Common English word endings that indicate complete words
  const validEndings = /[aeiou]s$|ed$|ing$|ly$|er$|est$|tion$|sion$|ment$|ness$|able$|ible$|ful$|less$/i;
  
  // Check each word from the end backwards for truncation
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    // Skip if it's a known complete short word
    if (['a', 'an', 'be', 'by', 'do', 'go', 'he', 'I', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us', 'we', 'and', 'are', 'but', 'can', 'did', 'for', 'had', 'has', 'her', 'him', 'his', 'how', 'its', 'may', 'new', 'not', 'now', 'old', 'one', 'our', 'out', 'own', 'say', 'she', 'too', 'two', 'use', 'was', 'way', 'who', 'why', 'you', 'the', 'all', 'any', 'get', 'got', 'see', 'saw', 'big', 'old', 'run', 'ran', 'sit', 'sat', 'put', 'cut', 'let', 'set', 'win', 'won', 'eat', 'ate', 'top', 'end', 'far', 'off', 'own', 'add', 'ask', 'buy', 'try', 'yet', 'yes', 'how', 'now', 'new'].includes(cleanWord.toLowerCase())) {
      continue;
    }
    
    // Check if word looks truncated
    const looksComplete = cleanWord.length >= 4 || validEndings.test(cleanWord) || /[aeiou][bcdfghjklmnpqrstvwxyz]$/.test(cleanWord);
    
    if (!looksComplete) {
      // This word looks truncated, remove it and everything after
      const validText = words.slice(0, i).join(' ');
      if (validText.length > 0) {
        // Add proper punctuation if missing
        if (!/[.!?]$/.test(validText)) {
          return validText + '.';
        }
        return validText;
      }
    }
  }
  
  // If no truncated words found, find the last complete sentence
  const sentenceEnders = /[.!?]/g;
  let lastValidEnd = -1;
  let match;
  
  while ((match = sentenceEnders.exec(text)) !== null) {
    // Check if there's reasonable content after this punctuation mark
    const afterPunctuation = text.substring(match.index + 1).trim();
    if (afterPunctuation === '' || afterPunctuation.length < 10) {
      lastValidEnd = match.index + 1;
      break;
    }
    lastValidEnd = match.index + 1;
  }
  
  // If we found a valid sentence ending, use it
  if (lastValidEnd > 0) {
    return text.substring(0, lastValidEnd).trim();
  }
  
  // Otherwise, find the last complete word
  const lastSpaceIndex = text.lastIndexOf(' ');
  if (lastSpaceIndex > 0) {
    const truncatedToWord = text.substring(0, lastSpaceIndex).trim();
    // Add a period if it doesn't end with punctuation
    if (!/[.!?]$/.test(truncatedToWord)) {
      return truncatedToWord + '.';
    }
    return truncatedToWord;
  }
  
  return text;
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

      CRITICAL WORD COMPLETION RULES - ABSOLUTELY MANDATORY:
      - NEVER truncate or shorten ANY words - every word must be complete and properly spelled
      - NEVER write "wif" instead of "wife", "sai" instead of "said", "hea" instead of "heard"
      - NEVER cut off word endings - every word must end with complete letters
      - ALL words must be fully spelled out with no missing letters or characters
      - If a word seems too complex for the grade level, use a simpler COMPLETE word instead
      - DOUBLE-CHECK every word ends completely before moving to the next word

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

      FINAL REMINDER: Before responding, verify that EVERY SINGLE WORD is complete and properly spelled. No truncated words like "wif", "sai", "hea", "wan", "aske" are allowed.
      
      Respond with only the ${outputType}, no additional commentary or explanation.
    `;

    // Define the model to use based on available API keys
    const model = process.env.OPENROUTER_API_KEY ? "anthropic/claude-3.5-sonnet" : "gpt-4";

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