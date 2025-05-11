import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from "@google/generative-ai";

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenerativeAI;
  private apiKey = "AIzaSyCDcNbF7qy2ExaAHqyIX-ljMVkUjbM_G8s";

  constructor() {
    this.ai = new GoogleGenerativeAI(this.apiKey);
  }

  async generateText(prompt: string, usePro: boolean = false): Promise<string> {
    try {
      // Use the more powerful pro model for PDF summarization and other complex tasks
      const modelName = usePro ? "gemini-1.5-pro" : "gemini-2.0-flash";
      console.log(`Using AI model: ${modelName}`);
      
      const model = this.ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: usePro ? 0.2 : 0.7, // Lower temperature for more factual responses with the pro model
          maxOutputTokens: usePro ? 8192 : 2048, // Allow longer outputs for the pro model
        }
      });
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating AI content:', error);
      return this.generateTextAlternative(prompt, usePro);
    }
  }

  async generateTextAlternative(prompt: string, usePro: boolean = false): Promise<string> {
    try {
      console.log('Trying alternative API approach...');
      
      // Use the more powerful pro model for summarization and complex tasks
      const modelName = usePro ? "gemini-1.5-pro" : "gemini-2.0-flash";
      
      // Direct fetch using the API endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: usePro ? 0.2 : 0.7,
              maxOutputTokens: usePro ? 8192 : 2048,
            }
          })
        }
      );
      
      if (!response.ok) {
        console.log(`First alternative failed with status ${response.status}, trying fallback model...`);
        return this.generateTextThirdOption(prompt, usePro);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      // Extract text from response based on the structure
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Unexpected response structure');
      }
    } catch (error) {
      console.error('Alternative method also failed:', error);
      return this.generateTextThirdOption(prompt, usePro);
    }
  }

  async generateTextThirdOption(prompt: string, usePro: boolean = false): Promise<string> {
    try {
      console.log('Trying third API approach with fallback model...');
      
      // Try a different model as fallback
      const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096,
        }
      });
      
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Third method also failed:', error);
      
      // Try the raw API with the flash model as final fallback
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 4096,
              }
            })
          }
        );
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Final fallback API response:', data);
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        } else {
          throw new Error('Unexpected response structure');
        }
      } catch (finalError) {
        console.error('All methods failed:', finalError);
        return 'Error: Unable to generate content after trying multiple approaches';
      }
    }
  }
}
