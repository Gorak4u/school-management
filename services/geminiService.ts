
import { GoogleGenAI } from "@google/genai";

// Initialize a variable to hold the AI client, which will be either the real one or a mock.
let ai: any;

try {
  // Safely check if process.env.API_KEY is available. Browsers don't have `process` by default.
  if (typeof process === 'undefined' || !process.env || !process.env.API_KEY) {
    throw new Error("API_KEY environment variable not found.");
  }
  // If the key exists, initialize the real client.
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

} catch (error) {
  // If anything fails (missing key, library error), create a mock client to prevent a crash.
  console.warn(`[Gemini Service] Initialization failed: ${(error as Error).message}. AI features will be disabled.`);
  
  ai = {
    models: {
      generateContent: async () => {
        // This mock response ensures that components calling this function don't break.
        return { text: "AI feature disabled: API key is not configured." };
      }
    }
  };
}

// Export the functions that use the `ai` client (which is now guaranteed to exist).

export const generateHomeworkIdeas = async (
  subject: string, 
  standard: string, 
  medium: string
): Promise<string> => {
  try {
    const prompt = `Generate 3 creative and educational homework ideas for a student in ${standard} standard (${medium} medium) for the subject "${subject}". 
    Keep them concise and actionable. Return as a plain bulleted list.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No ideas generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate ideas due to an error.";
  }
};

export const draftNotificationMessage = async (
  type: 'Absence' | 'Homework' | 'Fee',
  details: string
): Promise<string> => {
  try {
    let systemInstruction = "You are a polite school administrator assistant. Draft a short SMS message (max 160 chars).";
    
    const prompt = `Draft an SMS for ${type}. Details: ${details}. Keep it professional and short.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        maxOutputTokens: 100,
        // FIX: Added thinkingConfig as per Gemini API guidelines for using maxOutputTokens.
        // This reserves some tokens for model thinking, preventing empty responses.
        thinkingConfig: { thinkingBudget: 50 },
      }
    });

    return response.text || "Could not draft message.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error drafting message.";
  }
};