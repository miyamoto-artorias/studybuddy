import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { AiService } from '../../../services/ai.service';

export interface QuizQuestion {
  questionId?: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTIPLE' | 'TRUE_FALSE' | 'SHORT_TEXT' | 'ESSAY' | 'MATCHING' | 'ORDERING';
  options?: string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  points: number;
  matchingPairs?: {[key: string]: string};
  orderingSequence?: string[];
}

export interface Quiz {
  quizId?: number;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number; // in minutes
  passingScore: number;
  maxAttempts: number;
  status?: string; // ACTIVE, DRAFT, ARCHIVED
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatDividerModule
  ],
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent {
  topic: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  generatedQuiz: Quiz | null = null;
  userResponses: {[questionId: number]: string | string[]} = {};
  
  constructor(private aiService: AiService) {}
  
  async generateQuiz() {
    if (!this.topic.trim()) {
      this.errorMessage = 'Please enter a topic';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.generatedQuiz = null;
    this.userResponses = {};
    
    try {
      const prompt = this.createQuizPrompt(this.topic);
      const response = await this.aiService.generateText(prompt);
      
      console.log('Raw AI response:', response);
      
      // Extract the JSON from the response
      const jsonResponse = this.extractJsonFromResponse(response);
      
      if (jsonResponse) {
        this.generatedQuiz = jsonResponse as Quiz;
        
        // Assign questionId to each question (for tracking responses)
        this.generatedQuiz.questions.forEach((question, index) => {
          question.questionId = index + 1;
        });
        
        console.log('Parsed quiz:', this.generatedQuiz);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      this.errorMessage = 'Failed to generate quiz. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
  
  private createQuizPrompt(topic: string): string {
    return `Generate a quiz about "${topic}" with exactly 2 questions.

Your response should be valid JSON that follows this structure:
{
  "title": "A concise title related to ${topic}",
  "description": "A brief description of the quiz",
  "timeLimit": 60,
  "passingScore": 1,
  "maxAttempts": 3,
  "questions": [
    // Include exactly 2 questions from the types below
  ]
}

The questions should be formatted like this:
1. For multiple choice single answer:
{
  "questionText": "A clear question about ${topic}",
  "questionType": "MULTIPLE_CHOICE_SINGLE",
  "points": 1,
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "The correct option text"
}

2. For multiple choice multiple answers:
{
  "questionText": "A clear question about ${topic}",
  "questionType": "MULTIPLE_CHOICE_MULTIPLE",
  "points": 2,
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswers": ["Correct option 1", "Correct option 2"]
}

Please create a balanced quiz with interesting questions related to the topic. Return ONLY the JSON with no additional text.`;
  }
  
  private extractJsonFromResponse(response: string): Quiz | null {
    try {
      // First try to directly parse the entire response
      return JSON.parse(response) as Quiz;
    } catch (e) {
      // If direct parsing fails, try to extract JSON from the text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as Quiz;
        } catch (innerError) {
          console.error('Error parsing extracted JSON:', innerError);
          return null;
        }
      }
      return null;
    }
  }
  
  updateSingleChoiceResponse(questionId: number, answer: string) {
    this.userResponses[questionId] = answer;
    console.log('Updated responses:', this.userResponses);
  }
  
  updateMultipleChoiceResponse(questionId: number, option: string, isChecked: boolean) {
    // Initialize as array if not already
    if (!this.userResponses[questionId] || !Array.isArray(this.userResponses[questionId])) {
      this.userResponses[questionId] = [];
    }
    
    const responses = this.userResponses[questionId] as string[];
    
    if (isChecked) {
      if (!responses.includes(option)) {
        responses.push(option);
      }
    } else {
      const index = responses.indexOf(option);
      if (index !== -1) {
        responses.splice(index, 1);
      }
    }
    
    console.log('Updated responses:', this.userResponses);
  }
  
  isMultipleChoiceOptionSelected(questionId: number, option: string): boolean {
    return Array.isArray(this.userResponses[questionId]) && 
           (this.userResponses[questionId] as string[]).includes(option);
  }
  
  checkAnswers() {
    if (!this.generatedQuiz) return;
    
    let correctCount = 0;
    let totalPoints = 0;
    
    this.generatedQuiz.questions.forEach(question => {
      const userAnswer = this.userResponses[question.questionId!];
      
      if (question.questionType === 'MULTIPLE_CHOICE_SINGLE') {
        if (userAnswer === question.correctAnswer) {
          correctCount++;
          totalPoints += question.points;
        }
      } else if (question.questionType === 'MULTIPLE_CHOICE_MULTIPLE') {
        if (Array.isArray(userAnswer) && question.correctAnswers) {
          // Check if arrays have the same elements (order doesn't matter)
          const correctSet = new Set(question.correctAnswers);
          const userSet = new Set(userAnswer);
          
          if (correctSet.size === userSet.size && 
              [...correctSet].every(value => userSet.has(value))) {
            correctCount++;
            totalPoints += question.points;
          }
        }
      }
    });
    
    const totalQuestions = this.generatedQuiz.questions.length;
    const maxPoints = this.generatedQuiz.questions.reduce((sum, q) => sum + q.points, 0);
    
    alert(`You got ${correctCount} out of ${totalQuestions} questions correct (${totalPoints}/${maxPoints} points).`);
  }
}