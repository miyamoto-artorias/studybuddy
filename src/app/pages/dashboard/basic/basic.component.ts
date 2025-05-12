import { Component, OnInit } from '@angular/core';
import { AiService } from '../../../services/ai.service';
import { CommonModule } from '@angular/common';
import { EnrolledCoursesListComponent } from '../../course/enrolled-courses-list/enrolled-courses-list.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-basic',
  standalone: true,
  imports: [
    CommonModule,
    EnrolledCoursesListComponent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss']
})
export class BasicComponent implements OnInit {
  motivationalQuote: string = '';
  isLoadingQuote: boolean = false;
  
  constructor(private aiService: AiService) {}

  ngOnInit() {
    this.generateMotivationalQuote();
  }
  
  async generateMotivationalQuote() {
    this.isLoadingQuote = true;
    try {
      const prompt = "Generate a short, inspirational quote to motivate students to study. The quote can be original or from a famous person (with attribution). Keep it under 150 characters. Return only the quote text without any additional context.";
      
      console.log('Requesting motivational quote from AI service...');
      const response = await this.aiService.generateText(prompt);
      this.motivationalQuote = response.trim();
      console.log('Received quote:', this.motivationalQuote);
    } catch (error) {
      console.error('Error generating motivational quote:', error);
      this.motivationalQuote = "Education is the passport to the future, for tomorrow belongs to those who prepare for it today. — Malcolm X";
    } finally {
      this.isLoadingQuote = false;
    }
  }

  // async ngOnInit() {
  //   console.log('Testing Gemini AI...');
    
  //   try {
  //     // Test prompt
  //     const prompt = "What are 5 benefits of e-learning platforms?";
  //     console.log(`Sending prompt to Gemini: "${prompt}"`);
      
  //     console.time('AI Response Time');
  //     const response = await this.aiService.generateText(prompt);
  //     console.timeEnd('AI Response Time');
      
  //     console.log('%cGemini Response:', 'color: green; font-weight: bold');
  //     console.log(response);
  //   } catch (error) {
  //     console.error('Error in component while testing AI service:', error);
  //   }
  // }
}