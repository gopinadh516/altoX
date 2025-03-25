import { GeminiRequest, GeminiResponse } from '../types/gemini.types';

function determineLanguage(code: string, promptType: string): string {
  const lowerPrompt = promptType.toLowerCase();
  if (lowerPrompt.includes('react') || lowerPrompt.includes('tailwind')) {
    return 'jsx';
  }
  if (lowerPrompt.includes('bootstrap')) {
    return 'html';
  }
  if (code.includes('<!DOCTYPE html') || code.includes('<html')) {
    return 'html';
  }
  if (code.includes('import React')) {
    return 'jsx';
  }
  if (code.includes('@tailwind')) {
    return 'jsx';
  }
  return 'html';
}

export async function generateCodeFromGemini(request: GeminiRequest): Promise<GeminiResponse> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return { code: '', language: 'plaintext', error: 'Gemini API key is missing' };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    console.log('Sending request to Gemini:', { prompt: request.prompt });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${request.prompt}\n\nJSON Data:\n${JSON.stringify(request.jsonData, null, 2)}` }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini response:', data);

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    const language = determineLanguage(generatedText, request.prompt);

    return {
      code: generatedText.trim(),
      language: language
    };

  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      code: '',
      language: 'plaintext',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}