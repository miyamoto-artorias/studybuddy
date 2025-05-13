import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeacherGuard } from '../../guards/teacher.guard';
import { TeacherCoursesListComponent } from './teacher-courses-list/teacher-courses-list.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'teacher-courses-list',
  },


  {
    path: 'addcourse',
    title: 'addcourse Dashboard',
    loadComponent: () => import('./addcourse/addcourse.component').then(c => c.AddcourseComponent),
    canActivate: [TeacherGuard]
  },  {
    path: 'teachercourses',
    title: 'teachercourses Dashboard',
    loadComponent: () => import('./teacher-courses/teacher-courses.component').then(c => c.TeacherCoursesComponent),
    canActivate: [TeacherGuard]
  },
  {
    path: 'teachercourses/:id',
    title: 'Edit Course',
    loadComponent: () => import('./teacher-courses/teacher-courses.component').then(c => c.TeacherCoursesComponent),
    canActivate: [TeacherGuard]
  },



  {
    path: 'teacher-courses-list',
    component: TeacherCoursesListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeacherRoutingModule { }
