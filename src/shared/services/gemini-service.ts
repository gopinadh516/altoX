// filepath: d:\workspace\altoX\src\shared\services\gemini-service.ts
import { GeminiRequest, GeminiResponse } from '../types/gemini.types';

export async function generateCodeFromGemini(request: GeminiRequest): Promise<GeminiResponse> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return { code: '', language: 'javascript', error: 'Gemini API key is missing. Please set the VITE_GEMINI_API_KEY environment variable.' };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Given this JSON data: ${JSON.stringify(request.jsonData)}, ${request.prompt}`
          }]
        }]
      }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.error.message}`; // Try to get a more specific error
      } catch (e) {
        // Could not parse JSON error response
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
      return { code: '', language: 'javascript', error: 'No response candidates found in Gemini API response.' };
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    return {
      code: generatedText,
      language: 'javascript' // Or determine the language dynamically if possible
    };
  } catch (error) {
    return {
      code: '',
      language: 'javascript',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}