import OpenAI from "openai";

// Using OpenRouter as a proxy to access OpenAI models
const openai = new OpenAI({ 
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

// Function to generate summaries for different grade levels
async function attemptApiCall(text: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`API attempt ${i + 1} of ${retries}`);
      
      const response = await openai.chat.completions.create({
        model: "openai/gpt-4",
        messages: [
          {
            role: "system",
            content: 
              "You are an educational AI assistant that specializes in simplifying text for different grade levels. " +
              "Your task is to summarize the provided text at 12 different grade levels (1st through 12th grade) and include the original text as grade level 13. " +
              "For each grade level, maintain the key concepts but adjust vocabulary, sentence length, and complexity to be appropriate for that grade level. " +
              "For lower grades (1-3), use simple words, short sentences, and focus on concrete concepts. " +
              "For middle grades (4-8), gradually introduce more complex vocabulary and sentence structures, while still maintaining clarity. " +
              "For higher grades (9-12), include more abstract concepts, sophisticated vocabulary, and nuanced explanations. " +
              "Ensure each summary is accurate, educational, and tailored appropriately for the cognitive and reading abilities of students at that grade level. " +
              "Add the original text as grade level 13 without any modifications. " +
              "Respond with a JSON object where the keys are grade level numbers (1-13) and the values are the corresponding summaries."
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      });
      
      if (!response) {
        throw new Error("Empty response from API");
      }
      
      return response;
    } catch (error) {
      console.error(`API attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      console.log(`Retrying in ${(i + 1) * 1000}ms...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  // This should never be reached due to the throw in the catch block above,
  // but TypeScript may complain without an explicit return
  throw new Error("All API attempts failed");
}

// Function to clean up duplicate words in generated text
function cleanupDuplicateWords(text: string): string {
  // First, handle hyphenated words that might appear twice
  let cleaned = text.replace(/(\w+)[-](\w+)\s+\1[-]?\2/gi, "$1-$2");
  
  // Handle regular duplicate words, excluding common cases where duplication might be intentional
  const skipWords = ['the', 'a', 'an', 'and', 'or', 'but', 'if', 'of', 'to', 'in', 'on', 'at'];
  const regex = new RegExp(`\\b(\\w+)\\s+\\1\\b`, 'gi');
  
  cleaned = cleaned.replace(regex, (match, word) => {
    // Check if the word is in our skip list (case insensitive)
    if (skipWords.includes(word.toLowerCase())) {
      return match; // Keep the duplicate for these common words
    }
    return word; // Replace with single occurrence for other words
  });
  
  return cleaned;
}

export async function generateGradeLevelSummaries(text: string): Promise<Record<number, string>> {
  try {
    // Make sure we have text to process
    if (!text || text.trim() === '') {
      throw new Error("Empty text provided for summarization");
    }
    
    const response = await attemptApiCall(text);
    
    // Add safety checks for response structure
    if (!response || !response.choices || !response.choices.length) {
      throw new Error("Invalid response structure from API");
    }
    
    const firstChoice = response.choices[0];
    if (!firstChoice.message) {
      throw new Error("No message in API response");
    }
    
    const content = firstChoice.message.content || '';
    // If content is empty, throw an error
    if (content === '') {
      throw new Error("No content returned from OpenRouter");
    }
    
    try {
      const result = JSON.parse(content);
      
      // Clean up each summary to remove duplicate words
      const cleanedResult: Record<number, string> = {};
      for (const [level, summary] of Object.entries(result)) {
        cleanedResult[Number(level)] = cleanupDuplicateWords(summary as string);
      }
      
      return cleanedResult;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Failed to parse API response: " + (parseError as Error).message);
    }
  } catch (error) {
    console.error("Error generating summaries:", error);
    throw new Error("Failed to generate summaries: " + (error as Error).message);
  }
}
