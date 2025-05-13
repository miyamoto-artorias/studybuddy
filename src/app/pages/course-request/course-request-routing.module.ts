import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeacherGuard } from '../../guards/teacher.guard';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'basic',
  },

  {
    path: 'make-courses-request',
    title: 'Make Courses Request',
    loadComponent: () => import('./make-course-request/make-course-request.component').then(c => c.MakeCourseRequestComponent)
  },
  {
    path: 'requested-courses',
    title: 'Requested Courses',
    loadComponent: () => import('./requested-courses/requested-courses.component').then(c => c.RequestedCoursesComponent)
  },
  {
    path: 'view-course-requests',
    title: 'View Course Requests',
    loadComponent: () => import('./view-course-requests/view-course-requests.component').then(c => c.ViewCourseRequestsComponent)
   },
   {
    path: 'requested-courses-teacher',
    title: 'Requested Courses Teacher',
    loadComponent: () => import('./requested-courses-teacher/requested-courses-teacher.component').then(c => c.RequestedCoursesTeacherComponent),
    canActivate: [TeacherGuard]
   }

 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CourseRequestRoutingModule { }
