import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, forkJoin, of, from } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import * as pdfjs from 'pdfjs-dist';
import { AiService } from './ai.service';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  constructor(
    private http: HttpClient,
    private aiService: AiService
  ) {
    // Initialize PDF.js worker
    const pdfjsLib = (pdfjs as any);
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      const workerUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    }
  }

  private baseUrl = 'http://localhost:8081/api/course-content';
  private coursesbaseUrl = 'http://localhost:8081/api/courses';
  private categoriesUrl = 'http://localhost:8081/api/categories';

  // In AuthService
  downloadContent(courseId: number, chapterId: number, contentId: number): Observable<Blob> {
    console.log('CourseService: Starting content download');
    console.log('CourseService: Download parameters:', { courseId, chapterId, contentId });
    const url = `http://localhost:8081/api/course-content/course/${courseId}/chapter/${chapterId}/download/${contentId}`;
    console.log('CourseService: Download URL:', url);
    
    return this.http.get(url, { responseType: 'blob' }).pipe(
      tap(blob => {
        console.log('CourseService: Received blob response:', blob);
        console.log('CourseService: Blob size:', blob.size);
        console.log('CourseService: Blob type:', blob.type);
      }),
      catchError(error => {
        console.error('CourseService: Download failed:', error);
        throw error;
      })
    );
  }

  // Method to extract text from PDF blob and send to AI for summarization
  summarizePdfContent(pdfBlob: Blob, contentTitle: string): Observable<string> {
    console.log('Starting PDF summarization for:', contentTitle);
    
    return from(this.extractTextFromPdf(pdfBlob)).pipe(
      switchMap(pdfText => {
        console.log('Extracted PDF text length:', pdfText.length);
        
        // If text is too small, return a message
        if (pdfText.length < 100) {
          return of('The PDF content is too short or could not be properly extracted for summarization.');
        }
        
        // Generate prompt for summarization
        const prompt = this.createSummarizationPrompt(pdfText, contentTitle);
        
        // Call AI service to generate summary
        return from(this.aiService.generateText(prompt));
      }),
      catchError(error => {
        console.error('PDF summarization failed:', error);
        return of('Failed to summarize the PDF content. Please try again later.');
      })
    );
  }
  
  // Helper method to extract text from PDF blob
  private async extractTextFromPdf(pdfBlob: Blob): Promise<string> {
    try {
      // Convert Blob to ArrayBuffer
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfjsLib = (pdfjs as any);
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      // Variable to store all the text
      let fullText = '';
      
      // Iterate through each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text from items
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
          
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  }
  
  // Create a prompt for the AI to summarize the PDF content
  private createSummarizationPrompt(pdfText: string, contentTitle: string): string {
    // Trim the text if it's too long
    const maxTextLength = 15000; // Adjust based on AI model limitations
    const trimmedText = pdfText.length > maxTextLength 
      ? pdfText.substring(0, maxTextLength) + '...(content truncated due to length)'
      : pdfText;
    
    return `Please provide a concise summary of the following PDF document titled "${contentTitle}".
Focus on the main concepts, key points, and important details. Format the summary in plain text with clean formatting.

PDF CONTENT:
${trimmedText}

Please provide a well-structured summary that includes:
1. Main topic overview (2-3 sentences)
2. Key concepts (3-5 bullet points)
3. Important details (3-5 bullet points)
4. Conclusion (1-2 sentences)

IMPORTANT FORMATTING INSTRUCTIONS:
- Do NOT use markdown formatting (no asterisks for bold/italic, no hash symbols for headers)
- Use plain text formatting with proper spacing
- For bullet points, use simple dashes or bullets (•) followed by a space
- Use clean paragraph breaks for sections
- Avoid special characters and symbols that don't render well in plain text
- No need to include the section titles ("Main Topic Overview", etc.) - just include the content`;
  }

  downloadFile(fileName: string): Observable<Blob> {
    const url = `${this.baseUrl}/download/${fileName}`;
    return this.http.get(url, { responseType: 'blob' });
  }
  

  createCourse(teacherId: number, courseData: any): Observable<any> {
    const url = `${this.coursesbaseUrl}/${teacherId}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
  
    // Format the course data to match the working Postman request
    const formattedCourseData = {
      title: courseData.title,
      description: courseData.description,
      picture: courseData.picture,
      price: courseData.price,
      categoryIds: courseData.categoryIds,
      tags: courseData.tags || [] // Include the tags array
    };

    console.log('Sending course data:', formattedCourseData);
  
    return this.http.post(url, formattedCourseData, { headers }).pipe(
      tap(response => {
        console.log('Course created successfully:', response);
        // Refresh teacher courses after creation
        this.http.get(`${this.coursesbaseUrl}/teacher/${teacherId}`).pipe(
          tap(courses => {
            console.log('Updated teacher courses:', courses);
            // Update localStorage directly
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (currentUser.userType === 'TEACHER') {
              localStorage.setItem('teacherCourses', JSON.stringify(courses));
              // Also update the current user object in storage
              localStorage.setItem('currentUser', JSON.stringify({
                ...currentUser,
                courses
              }));
            }
          })
        ).subscribe();
      }),
      catchError(error => {
        console.error('Course creation failed:', error);
        throw error;
      })
    );
  }


  uploadContent(courseId: number, chapterId: number, content: { title: string; type: string; content?: string }, file?: File): Observable<any> {
    if (content.type === 'pdf' && file) {
      // Handle PDF upload
      const formData = new FormData();
      formData.append('title', content.title);
      formData.append('type', content.type);
      formData.append('file', file);

      const url = `${this.baseUrl}/course/${courseId}/chapter/${chapterId}/upload`;
      return this.http.post(url, formData).pipe(
        tap(response => console.log('PDF upload response:', response)),
        catchError(error => {
          console.error('PDF upload failed:', error);
          throw error;
        })
      );
    } else if (content.type === 'video') {
      // Handle video URL
      const videoData = {
        content: content.content,
        title: content.title,
        type: content.type
      };

      const url = `${this.baseUrl}/course/${courseId}/chapter/${chapterId}`;
      return this.http.post(url, videoData).pipe(
        tap(response => console.log('Video content response:', response)),
        catchError(error => {
          console.error('Video content upload failed:', error);
          throw error;
        })
      );
    } else {
      return throwError(() => new Error('Invalid content type or missing file'));
    }
  }

  // Add to CourseService

// Add to CourseService
createChapter(courseId: number, chapterData: any): Observable<any> {
  return this.http.post(
    `http://localhost:8081/api/course-chapters/course/${courseId}`,
    chapterData
  ).pipe(
    tap(response => console.log('Chapter created:', response)),
    catchError(error => {
      console.error('Chapter creation failed:', error);
      throw error;
    })
  );
}

getAllCourses(): Observable<any[]> {
  return this.http.get<any[]>(`${this.coursesbaseUrl}`).pipe(
    tap(courses => console.log('Fetched courses:', courses)),
    catchError(error => {
      console.error('Error fetching courses:', error);
      throw error;
    })
  );
}

getCourseWithCategories(courseId: number): Observable<any> {
  return this.http.get<any>(`${this.coursesbaseUrl}/${courseId}`).pipe(
    switchMap(course => {
      if (course.categoryIds && course.categoryIds.length > 0) {
        return forkJoin(
          course.categoryIds.map((categoryId: number) => 
            this.getCategoryById(categoryId)
          )
        ).pipe(
          map(categories => ({
            ...course,
            categories: categories
          }))
        );
      }
      return of(course);
    }),
    tap(course => console.log('Fetched course with categories:', course)),
    catchError(error => {
      console.error('Error fetching course with categories:', error);
      throw error;
    })
  );
}

getCourseById(courseId: number): Observable<any> {
  console.log('Fetching course with ID:', courseId);
  return this.http.get<any>(`${this.coursesbaseUrl}/${courseId}`).pipe(
    tap(course => console.log('Fetched course:', course)),
    catchError(error => {
      console.error('Error fetching course:', error);
      throw error;
    })
  );
}

makePayment(paymentData: {
  amount: number;
  payerId: number;
  receiverId: number;
  courseId: number;
  cardId: number;
}): Observable<any> {
  return this.http.post('http://localhost:8081/api/payments', paymentData).pipe(
    tap(response => console.log('Payment successful:', response)),
    catchError(error => {
      console.error('Payment failed:', error);
      throw error;
    })
  );
}

createEnrollment(enrollmentData: {
  userId: number;
  courseId: number;
}): Observable<any> {
  return this.http.post('http://localhost:8081/api/enrollments', enrollmentData).pipe(
    tap(response => console.log('Enrollment created:', response)),
    catchError(error => {
      console.error('Enrollment creation failed:', error);
      throw error;
    })
  );
}

getAllCategories(): Observable<any[]> {
  return this.http.get<any[]>(this.categoriesUrl).pipe(
    tap(categories => console.log('Fetched categories:', categories)),
    catchError(error => {
      console.error('Error fetching categories:', error);
      throw error;
    })
  );
}

getCategoryById(categoryId: number): Observable<any> {
  return this.http.get<any>(`${this.categoriesUrl}/${categoryId}`).pipe(
    tap(category => console.log('Fetched category:', category)),
    catchError(error => {
      console.error('Error fetching category:', error);
      throw error;
    })
  );
}

// Add a method to create a quiz for a given chapter
createQuiz(chapterId: number, quizData: any): Observable<any> {
  const url = `http://localhost:8081/api/chapters/${chapterId}/quizzes`;
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  return this.http.post(url, quizData, { headers }).pipe(
    tap(response => console.log('Quiz created:', response)),
    catchError(error => {
      console.error('Quiz creation failed:', error);
      throw error;
    })
  );
}

// Add a method to fetch quizzes for a given chapter
getChapterQuizzes(chapterId: number): Observable<any[]> {
  const url = `http://localhost:8081/api/chapters/${chapterId}/quizzes`;
  return this.http.get<any[]>(url).pipe(
    tap(quizzes => console.log('Fetched quizzes:', quizzes)),
    catchError(error => {
      console.error('Error fetching quizzes:', error);
      throw error;
    })
  );
}

// Remove createQuizAttempt method and keep only submitQuizResponses
submitQuizResponses(chapterId: number, quizId: number, userId: number, responses: { [key: string]: string | string[] }): Observable<any> {
  const url = `http://localhost:8081/api/chapters/${chapterId}/quizzes/${quizId}/attempt?userId=${userId}`;
  const payload = { responses };
  return this.http.post(url, payload).pipe(
    tap(response => console.log('Quiz responses submitted:', response)),
    catchError(error => {
      console.error('Quiz responses submission failed:', error);
      throw error;
    })
  );
}

uploadVideo(courseId: number, chapterId: number, file: File, title: string): Observable<any> {
  const url = `http://localhost:8081/api/course-content/course/${courseId}/chapter/${chapterId}/upload-video`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  return this.http.post(url, formData).pipe(
    tap(response => console.log('Video uploaded successfully:', response)),
    catchError(error => {
      console.error('Video upload failed:', error);
      throw error;
    })
  );
}

addYouTubeLink(courseId: number, chapterId: number, linkData: { title: string; url: string }): Observable<any> {
  const url = `http://localhost:8081/api/course-content/course/${courseId}/chapter/${chapterId}`;
  const payload = {
    title: linkData.title,
    type: 'video', // Updated to match the expected type
    content: linkData.url
  };

  console.log('Sending payload to add YouTube link:', payload);

  return this.http.post(url, payload, { headers: { 'Content-Type': 'application/json' } }).pipe(
    tap(response => console.log('YouTube link added successfully:', response)),
    catchError(error => {
      console.error('Adding YouTube link failed:', error);
      if (error.error) {
        console.error('Server error response:', error.error);
      }
      if (error.status === 400) {
        return throwError(() => new Error('Bad Request: Please check the YouTube link and try again.'));
      } else if (error.status === 500) {
        return throwError(() => new Error('Server Error: Please try again later.'));
      } else {
        return throwError(() => new Error(error.error?.message || 'Unknown error'));
      }
    })
  );
}

streamVideo(courseId: number, chapterId: number, contentId: number): Observable<Blob> {
  const url = `http://localhost:8081/api/course-content/course/${courseId}/chapter/${chapterId}/stream-video/${contentId}`;
  const headers = new HttpHeaders({
    'Range': 'bytes=0-'
  });

  return this.http.get(url, { headers, responseType: 'blob' }).pipe(
    tap(response => console.log('Video stream started successfully:', response)),
    catchError(error => {
      console.error('Video stream failed:', error);
      throw error;
    })
  );
}

searchCourses(query: string): Observable<any[]> {
  const url = `${this.coursesbaseUrl}/search?query=${encodeURIComponent(query)}`;
  return this.http.get<any[]>(url).pipe(
    tap(courses => console.log(`Fetched courses for query "${query}":`, courses)),
    catchError(error => {
      console.error(`Error fetching courses for query "${query}":`, error);
      return throwError(() => error); // Rethrow the error to be handled by the component
    })
  );
}

getAllTeachers(): Observable<any[]> {
  const url = 'http://localhost:8081/api/teachers';
  return this.http.get<any[]>(url).pipe(
    tap(teachers => console.log('Fetched all teachers:', teachers)),
    catchError(error => {
      console.error('Error fetching teachers:', error);
      return throwError(() => error);
    })
  );
}

getTeacherRequestedCourses(teacherId: number): Observable<any[]> {
  const url = `http://localhost:8081/api/courses/request-teacher/${teacherId}`;
  return this.http.get<any[]>(url).pipe(
    tap(courses => console.log('Fetched teacher requested courses:', courses)),
    catchError(error => {
      console.error('Error fetching teacher requested courses:', error);
      return throwError(() => error);
    })
  );
}

createCourseForRequest(requestId: number, teacherId: number, courseData: any): Observable<any> {
  const url = `http://localhost:8081/api/courses/request/${requestId}/teacher/${teacherId}`;
  return this.http.post(url, courseData).pipe(
    tap(response => console.log(`Created course for request ${requestId}:`, response)),
    catchError(error => {
      console.error(`Error creating course for request ${requestId}:`, error);
      return throwError(() => error);
    })
  );
}
}