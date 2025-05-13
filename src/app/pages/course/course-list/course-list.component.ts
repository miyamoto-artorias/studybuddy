import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators'; // Added map
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {
  courses: any[] = [];
  enrolledCourses: any[] = [];
  loading = true;
  error: string | null = null;
  pageTitle = 'Available Courses';

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    this._fetchCourseData();
    this.loadEnrolledCourses();
    
    // Debug info
    console.log('Current router URL at init:', this.router.url);
    this.router.events.subscribe(event => {
      console.log('Router event:', event);
    });
  }

  // Helper method to navigate to course detail with the correct URL structure
  navigateToCourse(courseId: number): void {
    console.log('Navigating to course:', courseId);
    // Navigate to the course detail page
    this.router.navigate(['/pages/course/courses', courseId]);
  }

  // Get full image URL using the CourseService
  getFullImageUrl(imagePath: string | null): string {
    return this.courseService.getFullImageUrl(imagePath);
  }

  private _fetchCourseData(): void {
    this.loading = true;
    this.error = null;
    this.courses = [];

    console.log('Current query params (snapshot) at start of _fetchCourseData:', JSON.stringify(this.route.snapshot.queryParams));

    this.route.queryParams.pipe(
      tap(params => {
        console.log('Query params from observable in _fetchCourseData:', JSON.stringify(params));
      }),
      switchMap(params => {
        const searchQuery = params['search'];
        if (searchQuery) {
          this.pageTitle = `Search Results for "${searchQuery}"`;
          console.log(`Performing search for: ${searchQuery}`);
          return this.courseService.searchCourses(searchQuery);
        } else {
          this.pageTitle = 'Available Courses';
          console.log('Fetching all courses');
          return this.courseService.getAllCourses();
        }
      }),
      switchMap(coursesFromServer => {
        const currentParams = this.route.snapshot.queryParams; // Get current params again for context
        const isSearchResult = !!currentParams['search'];

        console.log(`Received coursesFromServer (isSearchResult: ${isSearchResult}):`, coursesFromServer);

        if (!coursesFromServer) {
          console.warn('Received null or undefined from course service.');
          this.loading = false;
          return of([]);
        }
        if (!Array.isArray(coursesFromServer)) {
            console.error('Expected an array of courses from server, got:', coursesFromServer);
            this.error = 'Received invalid data format from server.';
            this.loading = false;
            return of([]);
        }
        if (coursesFromServer.length === 0) {
          console.log('No courses found from server.');
          this.loading = false;
          return of([]);
        }

        if (isSearchResult) {
          console.log('Processing as search results:', coursesFromServer);
          // Search results might not have 'id' and might have 'categoryIds'.
          // We prepare them for display. If they don't have 'id', we can't use getCourseWithCategories.
          const processedSearchResults = coursesFromServer.map(course => {
            const mappedCourse = { ...course }; // Create a new object

            // Process course image URL
            if (mappedCourse.picture) {
              mappedCourse.fullImageUrl = this.courseService.getFullImageUrl(mappedCourse.picture);
            } else {
              mappedCourse.fullImageUrl = 'assets/default-course.jpg';
            }

            // Ensure 'tags' is an array, even if missing or null from API
            mappedCourse.tags = Array.isArray(course.tags) ? course.tags : [];

            // If categories are just IDs, create a basic structure for display
            // The template expects 'categories' to be an array of objects with at least a 'title'.
            if (Array.isArray(course.categoryIds) && (!course.categories || course.categories.length === 0)) {
              mappedCourse.categories = course.categoryIds.map((id: number) => ({
                id: id,
                title: `Category ${id}` // Placeholder title, ideally resolve this if possible
              }));
            } else if (!Array.isArray(mappedCourse.categories)) {
                mappedCourse.categories = [];
            }
            return mappedCourse;
          });
          return of(processedSearchResults);
        } else {
          // This is for getAllCourses, which presumably return courses with 'id'
          console.log('Processing all courses (non-search):', coursesFromServer);
          const courseObservables = coursesFromServer.map(course => {
            if (course && typeof course.id !== 'undefined') {
              return this.courseService.getCourseWithCategories(course.id).pipe(
                map(courseWithCategories => {
                  if (courseWithCategories && courseWithCategories.picture) {
                    courseWithCategories.fullImageUrl = this.courseService.getFullImageUrl(courseWithCategories.picture);
                  } else {
                    courseWithCategories.fullImageUrl = 'assets/default-course.jpg';
                  }
                  return courseWithCategories;
                })
              );
            } else {
              console.warn('Course object (non-search) is invalid or missing ID:', course);
              return of(null);
            }
          });
          return forkJoin(courseObservables);
        }
      })
    ).subscribe({
      next: (processedCourses) => {
        // Filter out any null results if forkJoin was used (for non-search)
        this.courses = processedCourses.filter(c => c !== null);
        this.loading = false;
        console.log('Final courses to display:', this.courses);

        if (this.courses.length === 0 && this.route.snapshot.queryParams['search'] && !this.error) {
          console.log('Search returned no results, or results could not be processed.');
          // You can set a specific message here if desired, e.g.,
          // this.error = "No courses found matching your search criteria.";
        }
      },
      error: (err) => {
        console.error('Error loading courses in component subscription:', err);
        let specificErrorMessage = 'Failed to load courses. Please try again later.';
        if (err instanceof HttpErrorResponse) {
          if (err.error && typeof err.error.message === 'string') {
            specificErrorMessage = err.error.message;
          } else if (err.error && typeof err.error === 'string') { // Handle plain string errors
             specificErrorMessage = err.error;
          } else if (err.message) {
            specificErrorMessage = err.message;
          } else {
            specificErrorMessage = `HTTP Error ${err.status}: ${err.statusText}`;
          }
        } else if (err.message) {
          specificErrorMessage = err.message;
        }
        this.error = specificErrorMessage;
        this.loading = false;
      }
    });
  }

  loadCourses(): void {
    console.log('Retry button clicked or loadCourses called. Refetching data...');
    this._fetchCourseData();
  }

  loadEnrolledCourses(): void {
    this.authService.getEnrolledCourses().subscribe({
      next: (courses) => {
        this.enrolledCourses = courses;
      },
      error: (err) => {
        console.error('Error loading enrolled courses:', err);
        this.enrolledCourses = [];
      }
    });
  }

  isEnrolled(courseId: number): boolean {
    return this.enrolledCourses.some(course => course.id === courseId);
  }

  isSearchMode(): boolean {
    return this.route.snapshot.queryParams['search'] !== undefined;
  }
}
