import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('A variável de ambiente GEMINI_API_KEY não está definida.');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askGemini(question) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: question,
  });
  return response.text;
}
