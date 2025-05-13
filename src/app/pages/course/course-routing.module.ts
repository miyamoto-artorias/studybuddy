import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CourseListComponent } from './course-list/course-list.component';
import { CourseDetailComponent } from './course-detail/course-detail.component';
import { EnrolledCoursesListComponent } from './enrolled-courses-list/enrolled-courses-list.component';
import { EnrolledCourseViewComponent } from './enrolled-course-view/enrolled-course-view.component';
import { TeacherGuard } from '../../guards/teacher.guard';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'basic',
  },


  {
    path: 'addcourse',
    title: 'addcourse Dashboard',
    loadComponent: () => import('./addcourse/addcourse.component').then(c => c.AddcourseComponent),
    canActivate: [TeacherGuard]
  },
  {
    path: 'teachercourses',
    title: 'teachercourses Dashboard',
    loadComponent: () => import('./teacher-courses/teacher-courses.component').then(c => c.TeacherCoursesComponent),
    canActivate: [TeacherGuard]
  },
  {
    path: 'courses',
    component: CourseListComponent
  },
  {
    path: 'course/:id',
    component: CourseDetailComponent
  },

  {
    path: 'enrolled-courses-list',
    component: EnrolledCoursesListComponent
  },
  {
    path: 'enrolled-courses-view/:id',
    component: EnrolledCourseViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CourseRoutingModule { }
