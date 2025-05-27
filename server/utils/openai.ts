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
      Ensure each summary is accurate, educational, and tailored appropriately for the cognitive and reading abilities of students at that grade level.
      Respond with a JSON object where the keys are grade level numbers (1-12) and the values are the corresponding summaries.
    `;

    // Define the model to use based on available API keys
    const model = process.env.OPENROUTER_API_KEY ? "openai/gpt-4-turbo" : "gpt-4";

    // Make the API request
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.7,
      max_tokens: 2500,
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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      
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
