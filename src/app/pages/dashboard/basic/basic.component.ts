import { Component, OnInit } from '@angular/core';
import { AiService } from '../../../services/ai.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-basic',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss']
})
export class BasicComponent implements OnInit {
  constructor(private aiService: AiService) {}

  async ngOnInit() {
    console.log('Testing Gemini AI...');
    
    try {
      // Test prompt
      const prompt = "What are 5 benefits of e-learning platforms?";
      console.log(`Sending prompt to Gemini: "${prompt}"`);
      
      console.time('AI Response Time');
      const response = await this.aiService.generateText(prompt);
      console.timeEnd('AI Response Time');
      
      console.log('%cGemini Response:', 'color: green; font-weight: bold');
      console.log(response);
    } catch (error) {
      console.error('Error in component while testing AI service:', error);
    }
  }
}