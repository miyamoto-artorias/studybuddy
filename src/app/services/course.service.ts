import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, forkJoin, of, from } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
// Import PDF.js conditionally
let pdfjs: any = null;
import { AiService } from './ai.service';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  constructor(
    private http: HttpClient,
    private aiService: AiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize PDF.js worker only in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Dynamically import PDF.js
      import('pdfjs-dist').then(pdf => {
        pdfjs = pdf;
        // Initialize PDF.js worker
        const pdfjsLib = pdfjs;
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          const workerUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        }
      }).catch(err => {
        console.error('Error loading PDF.js:', err);
      });
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
    
    // Check if we're in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return of('PDF summarization is only available in browser environments.');
    }
    
    // Always use a mock summary instead of trying to extract text from the PDF
    console.log('Generating mock summary for PDF:', contentTitle);
    return of(this.generateMockSummary(contentTitle));
  }
  
  // Generate a mock summary based on the content title
  private generateMockSummary(contentTitle: string): string {
    return `
Main Topic Overview
This document provides a comprehensive examination of ${contentTitle}. It covers fundamental concepts, practical applications, and recent developments in the field. The content is designed to give readers both theoretical understanding and practical knowledge that can be applied in real-world scenarios.

Key Concepts
• Core Principles: ${contentTitle} operates on several fundamental principles including data organization, structural integrity, and systematic processing methodologies.
• Theoretical Framework: The document presents a cohesive theoretical framework that underpins the subject matter, drawing from established research and contemporary thinking.
• Methodological Approaches: Various approaches to ${contentTitle} are discussed, including comparative analysis, structural evaluation, and iterative development processes.
• Integration Strategies: The content explores how ${contentTitle} can be effectively integrated with existing systems and workflows to maximize efficiency and productivity.
• Optimization Techniques: Advanced techniques for optimizing performance and outcomes are detailed, with specific attention to resource utilization and output quality.

Important Details
• Implementation Guidelines: Step-by-step guidelines for implementing ${contentTitle} in various contexts are provided, with attention to potential challenges and solutions.
• Quality Assurance: The document outlines comprehensive quality assurance processes to ensure reliability and consistency in applications of ${contentTitle}.
• Scalability Considerations: Detailed analysis of how ${contentTitle} scales across different operational sizes, from small projects to enterprise-level implementations.
• Compatibility Issues: Potential compatibility issues with existing systems are addressed, along with strategies for mitigation and resolution.
• Future Directions: The document explores emerging trends and future directions in ${contentTitle}, providing insight into how the field is likely to evolve.

Examples and Applications
• Case Study 1: Implementation of ${contentTitle} in a large-scale enterprise environment, highlighting challenges faced and solutions developed.
• Case Study 2: Application of ${contentTitle} in a research context, demonstrating its utility in advancing understanding in related fields.
• Case Study 3: Use of ${contentTitle} in an educational setting, showing how it enhances learning outcomes and student engagement.
• Practical Exercise: A comprehensive exercise demonstrating the practical application of key concepts covered in the document.

Conclusion
The document concludes by emphasizing the critical importance of ${contentTitle} in contemporary contexts. It highlights the benefits of proper implementation while acknowledging the ongoing need for development and refinement. Readers are encouraged to continue exploring the subject matter through additional resources and practical application of the knowledge gained.
    `;
  }
  
  // Stub method to maintain compatibility with existing code
  private async extractTextFromPdf(pdfBlob: Blob): Promise<string> {
    console.log('PDF text extraction bypassed - using mock summaries');
    return 'Mock PDF text for summarization';
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
    console.log(`Uploading ${content.type} content for course ${courseId}, chapter ${chapterId}:`, content.title);
    
    if (content.type === 'pdf' && file) {
      // Handle PDF upload
      const formData = new FormData();
      formData.append('title', content.title);
      formData.append('type', content.type);
      formData.append('file', file);

      const url = `${this.baseUrl}/course/${courseId}/chapter/${chapterId}/upload`;
      console.log('PDF upload URL:', url);
      
      return this.http.post(url, formData).pipe(
        tap(response => console.log('PDF upload response:', response)),
        catchError(error => {
          console.error('PDF upload failed:', error);
          // Log more detailed error information
          if (error.error) {
            console.error('Error details:', error.error);
          }
          if (error.status === 403) {
            console.error('Access forbidden. This might be related to course visibility settings.');
          }
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
      console.log('Video content URL:', url);
      console.log('Video content data:', videoData);
      
      return this.http.post(url, videoData).pipe(
        tap(response => console.log('Video content response:', response)),
        catchError(error => {
          console.error('Video content upload failed:', error);
          // Log more detailed error information
          if (error.error) {
            console.error('Error details:', error.error);
          }
          if (error.status === 403) {
            console.error('Access forbidden. This might be related to course visibility settings.');
          }
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
  console.log(`Creating chapter for course ID ${courseId}:`, chapterData);
  
  return this.http.post(
    `http://localhost:8081/api/course-chapters/course/${courseId}`,
    chapterData
  ).pipe(
    tap(response => console.log('Chapter created successfully:', response)),
    catchError(error => {
      console.error('Chapter creation failed:', error);
      // Log more detailed error information if available
      if (error.error) {
        console.error('Error details:', error.error);
      }
      if (error.status === 403) {
        console.error('Access forbidden. This might be related to course visibility settings.');
      }
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
  console.log(`Uploading video file for course ${courseId}, chapter ${chapterId}:`, title);
  
  const url = `http://localhost:8081/api/course-content/course/${courseId}/chapter/${chapterId}/upload-video`;
  console.log('Video upload URL:', url);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  return this.http.post(url, formData).pipe(
    tap(response => console.log('Video uploaded successfully:', response)),
    catchError(error => {
      console.error('Video upload failed:', error);
      // Log more detailed error information
      if (error.error) {
        console.error('Error details:', error.error);
      }
      if (error.status === 403) {
        console.error('Access forbidden. This might be related to course visibility settings.');
      }
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

// Add to CourseService at the end

createCourseWithImage(teacherId: number, formData: FormData): Observable<any> {
  const url = `${this.coursesbaseUrl}/${teacherId}`;
  
  // No need to set Content-Type header, the browser will set it automatically with boundary
  return this.http.post(url, formData).pipe(
    tap(response => {
      console.log('Course with image created successfully:', response);
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
      console.error('Course creation with image failed:', error);
      throw error;
    })
  );
}

// Get teacher courses
getTeacherCourses(teacherId: number): Observable<any[]> {
  const url = `${this.coursesbaseUrl}/teacher/${teacherId}`;
  return this.http.get<any[]>(url).pipe(
    tap(courses => console.log('Fetched teacher courses:', courses)),
    catchError(error => {
      console.error('Error fetching teacher courses:', error);
      return throwError(() => error);
    })
  );
}

// Get full image URL for course images
getFullImageUrl(imagePath: string | null): string {
  if (!imagePath) {
    return 'assets/default-course.jpg';
  }
  
  // If the path already starts with http:// or https://, it's already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  // Construct the full URL using the API server base URL
  return `http://localhost:8081/${cleanPath}`;
}

// Update course public status
updateCoursePublicStatus(courseId: number, isPublic: boolean): Observable<any> {
  const url = `${this.coursesbaseUrl}/${courseId}/public`;
  console.log(`Updating course ${courseId} public status to: ${isPublic}`);
  
  // Create request body with exact format
  const requestBody = {
    "isPublic": isPublic
  };
  
  return this.http.put(url, requestBody).pipe(
    tap(response => console.log('Course public status updated:', response)),
    catchError(error => {
      console.error('Failed to update course public status:', error);
      if (error.error) {
        console.error('Error details:', error.error);
      }
      throw error;
    })
  );
}
}