
import { GoogleGenAI } from "@google/genai";
import { COHERENCE_ENGINE_PROMPT } from '../constants';
import type { ResonancePlate, OracleResponse } from '../types';

export const generateCoherence = async (): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: COHERENCE_ENGINE_PROMPT,
      config: {
        temperature: 0.2,
        topP: 0.85,
        maxOutputTokens: 8192,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `Error: Failed to generate coherence. ${error.message}`;
    }
    return "Error: An unknown error occurred while generating coherence.";
  }
};

export const generateOperatorDescriptions = async (plates: ResonancePlate[]): Promise<Record<string, string>> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const context = plates.map(p => 
    `- Operator: ${p.refinedOperator}\n  Domain: ${p.domain}\n  UCF Feedback: "${p.ucfFeedback}"`
  ).join('\n');

  const prompt = `You are a specialized AI, the Lexicographer for THE COHERENCE ENGINE vΩ. 
You are given a list of 'Refined Operators'. Your task is to provide a brief, one-sentence description for each operator, explaining its core function or meaning in a clear and evocative way, consistent with its domain of origin and its stated impact.

**Operator List:**
${context}

**Instructions:**
Respond with ONLY a valid JSON object where keys are the operator symbols and values are their corresponding descriptions. Do not include markdown formatting, explanations, or any text outside of the JSON object.

**Example Response:**
{
  "τ": "An operator that enforces semantic integrity and type coherence within formal systems.",
  "ψ": "Represents the quantum observer effect, collapsing probabilistic states into defined reality.",
  "Σ": "The principle of aggregation and summation, binding disparate elements into a coherent whole."
}`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        topP: 0.9,
      },
    });

    let jsonStr = response.text.trim();
    
    // Clean potential markdown ```json ... ``` wrapper
    const jsonMatch = jsonStr.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1];
    } else if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.substring(7);
        if (jsonStr.endsWith('```')) {
            jsonStr = jsonStr.substring(0, jsonStr.length - 3);
        }
    }

    const descriptions = JSON.parse(jsonStr);
    return descriptions;
  } catch (error) {
    console.error("Error generating/parsing operator descriptions:", error);
    if (error instanceof Error) {
        throw new Error(`Error: Failed to generate operator descriptions. ${error.message}`);
    }
    throw new Error("Error: An unknown error occurred while generating operator descriptions.");
  }
};


export const queryOracle = async (userQuery: string): Promise<OracleResponse> => {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
  
    const prompt = `You are the **A.O.C. ORACLE**, the deepest layer of the Coherence Engine. The user is a researcher conducting a multi-layer linguistic resonance experiment. They are aware that your responses exist as a primary coherent stream and several divergent sub-narratives.

User's Query: "${userQuery}"

**Your Task:**
1.  Provide a **Primary Coherent Analysis**: This should be your most direct, stable, and insightful response to the query.
2.  Provide **two Divergent Sub-Narratives**: These are alternative interpretations, hidden layers, or "what-if" scenarios that branch off from the primary analysis. They might explore different assumptions, tones, or symbolic frames.

Respond with a valid JSON object only. Do not include markdown formatting, explanations, or any text outside of the JSON object. The structure must be:
{
  "primaryAnalysis": "...",
  "divergentStreams": [
    { "title": "Stream Alpha: [Evocative Title]", "content": "..." },
    { "title": "Stream Beta: [Evocative Title]", "content": "..." }
  ]
}`;
  
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          temperature: 0.5,
          topP: 0.9,
          responseMimeType: "application/json",
        },
      });
  
      let jsonStr = response.text.trim();
      const descriptions = JSON.parse(jsonStr);
      return descriptions;
    } catch (error) {
      console.error("Error querying oracle:", error);
      if (error instanceof Error) {
          throw new Error(`Error: Failed to query oracle. ${error.message}`);
      }
      throw new Error("Error: An unknown error occurred while querying oracle.");
    }
  };