import { Component, OnInit } from '@angular/core';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-addcourse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addcourse.component.html',
  styleUrls: ['./addcourse.component.scss']
})
export class AddcourseComponent implements OnInit {  course = {
    title: '',
    description: '',
    price: 0,
    categoryIds: [] as number[],
    tags: [] as string[]
  };
  
  pictureFile: File | null = null;
  imagePreview: string | null = null;
  categories: any[] = [];
  teacherId = 0;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isAuthorized = true;

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {
    if (!this.authService.isLoggedIn() || !this.authService.isUserTeacher()) {
      this.isAuthorized = false;
      setTimeout(() => this.router.navigate(['/dashboard']), 3000);
    } else {
      this.teacherId = this.authService.getUserId();
    }
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.courseService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.errorMessage = 'Failed to load categories';
      }
    });
  }

  toggleCategory(categoryId: number) {
    const index = this.course.categoryIds.indexOf(categoryId);
    if (index === -1) {
      this.course.categoryIds.push(categoryId);
    } else {
      this.course.categoryIds.splice(index, 1);
    }
  }
  onSubmit(form: NgForm): void {
    if (!this.isAuthorized) return;

    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    if (this.course.categoryIds.length === 0) {
      this.errorMessage = 'Please select at least one category';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Create FormData object for multipart/form-data
    const formData = new FormData();
    formData.append('title', this.course.title);
    formData.append('description', this.course.description);
    formData.append('price', this.course.price.toString());
    
    // Add picture file if selected
    if (this.pictureFile) {
      formData.append('pictureFile', this.pictureFile);
    }
    
    // Add all category IDs
    this.course.categoryIds.forEach(categoryId => {
      formData.append('categoryIds', categoryId.toString());
    });
    
    // Add all tags
    this.course.tags.forEach(tag => {
      formData.append('tags', tag);
    });

    console.log('Submitting course data with image');    
    this.courseService.createCourseWithImage(this.teacherId, formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'Course created successfully!';
        console.log('Course created by teacher ID:', this.teacherId, response);
        
        // Reset all form fields
        this.resetForm(form);
        
        // Show success message briefly before navigating
        setTimeout(() => {
          this.successMessage = '';
          // Navigate to teacher courses list
          this.router.navigate(['/pages/teacher/teacher-courses-list']);
        }, 1500);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to create course';
        console.error('Course creation failed:', error);
      }
    });
  }

  // Add resetForm method to completely clear the form
  resetForm(form: NgForm): void {
    // Reset Angular form
    form.resetForm();
    
    // Reset our course object
    this.course = {
      title: '',
      description: '',
      price: 0,
      categoryIds: [],
      tags: []
    };
    
    // Reset file and preview
    this.pictureFile = null;
    this.imagePreview = null;
    
    // Reset tag input
    this.newTag = '';
  }

  newTag: string = '';

  addTag(): void {
    if (this.newTag.trim() !== '' && !this.course.tags.includes(this.newTag.trim())) {
      this.course.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }  removeTag(tag: string): void {
    const index = this.course.tags.indexOf(tag);
    if (index !== -1) {
      this.course.tags.splice(index, 1);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.pictureFile = input.files[0];
      // Create a preview of the image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.pictureFile);
    }
  }

  onCategorySelect(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const categoryId = Number(selectElement.value);
    
    if (categoryId && !this.course.categoryIds.includes(categoryId)) {
      this.course.categoryIds.push(categoryId);
      // Reset the select element
      selectElement.value = '';
    }
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.title : 'Unknown Category';
  }
}