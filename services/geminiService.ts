import { GoogleGenAI } from "@google/genai";
import { TrainingMetric } from '../types';

export const analyzeTrainingData = async (data: TrainingMetric[]): Promise<string> => {
  // Use a safe check for process.env in browser environments
  const apiKey = globalThis.process?.env?.API_KEY;

  if (!apiKey) {
    return "API Key not found. Please ensure the API_KEY environment variable is configured.";
  }

  if (data.length === 0) {
    return "No training data available to analyze yet.";
  }

  // Create a summary of the data for the LLM
  // We take the start, middle, and end of the training session to save tokens
  const snippet = {
    start: data.slice(0, 5),
    end: data.slice(-5),
    averageReward: data.reduce((acc, curr) => acc + curr.reward, 0) / data.length
  };

  const prompt = `
    You are an AI Optimization Expert for Reinforcement Learning.
    Analyze the following training metrics JSON snippet (Start and End of episodes).
    
    Data: ${JSON.stringify(snippet)}

    1. Is the model learning (is reward increasing, loss decreasing)?
    2. Suggest 2-3 specific parameter adjustments for the Logic Flow or Hyperparameters.
    3. Keep it concise (under 100 words).
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Analysis failed to generate text.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI Insight service.";
  }
};