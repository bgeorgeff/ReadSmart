import OpenAI from "openai";

// Using OpenRouter as a proxy to access OpenAI models
const openai = new OpenAI({ 
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

// Function to generate summaries for different grade levels
export async function generateGradeLevelSummaries(text: string): Promise<Record<number, string>> {
  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an educational AI assistant that specializes in simplifying text for different grade levels. " +
            "Your task is to summarize the provided text at 12 different grade levels (1st through 12th grade). " +
            "For each grade level, maintain the key concepts but adjust vocabulary, sentence length, and complexity to be appropriate for that grade level. " +
            "For lower grades (1-3), use simple words, short sentences, and focus on concrete concepts. " +
            "For middle grades (4-8), gradually introduce more complex vocabulary and sentence structures, while still maintaining clarity. " +
            "For higher grades (9-12), include more abstract concepts, sophisticated vocabulary, and nuanced explanations. " +
            "Ensure each summary is accurate, educational, and tailored appropriately for the cognitive and reading abilities of students at that grade level. " +
            "Respond with a JSON object where the keys are grade level numbers (1-12) and the values are the corresponding summaries."
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '';
    // If content is empty, throw an error
    if (content === '') {
      throw new Error("No content returned from OpenRouter");
    }
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Error generating summaries:", error);
    throw new Error("Failed to generate summaries: " + (error as Error).message);
  }
}
