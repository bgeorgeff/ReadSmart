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
      max_tokens: 2500
    });

    // Get the generated content
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from API");
    }

    // Parse the JSON response
    const summaries = JSON.parse(content);
    return summaries;
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
