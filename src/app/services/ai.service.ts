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

  async generateText(prompt: string): Promise<string> {
    try {
      const model = this.ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating AI content:', error);
      return this.generateTextAlternative(prompt);
    }
  }

  async generateTextAlternative(prompt: string): Promise<string> {
    try {
      console.log('Trying alternative API approach...');
      
      // Direct fetch using the API endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );
      
      if (!response.ok) {
        console.log(`First alternative failed with status ${response.status}, trying gemini-1.5-flash...`);
        return this.generateTextThirdOption(prompt);
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
      return this.generateTextThirdOption(prompt);
    }
  }

  async generateTextThirdOption(prompt: string): Promise<string> {
    try {
      console.log('Trying third API approach with gemini-1.5-flash...');
      
      // Try a different model name
      const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Third method also failed:', error);
      
      // Try the raw API with the newer model
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
              }]
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
