import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CourseListComponent } from '../../course-list/course-list.component';
import { CourseDetailComponent } from '../../course-detail/course-detail.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'basic',
  },
  {
    path: 'basic',
    title: 'Basic Dashboard',
    loadComponent: () => import('./basic/basic.component').then(c => c.BasicComponent)
  },
  {
    path: 'playground',
    title: 'playground Dashboard',
    loadComponent: () => import('./playground/playground.component').then(c => c.PlaygroundComponent)
  },
  {
    path: 'addcourse',
    title: 'addcourse Dashboard',
    loadComponent: () => import('../../MyBucket/addcourse/addcourse.component').then(c => c.AddcourseComponent)
  },
  {
    path: 'teachercourses',
    title: 'teachercourses Dashboard',
    loadComponent: () => import('../../MyBucket/teacher-courses/teacher-courses.component').then(c => c.TeacherCoursesComponent)
  },
  {
    path: 'courses',
    component: CourseListComponent
  },
  {
    path: 'course/:id',
    component: CourseDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
