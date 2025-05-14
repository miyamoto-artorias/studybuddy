import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeacherGuard } from '../../guards/teacher.guard';
import { TeacherCoursesListComponent } from './teacher-courses-list/teacher-courses-list.component';
import { TeacherRequestComponent } from './teacher-request/teacher-request.component';

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
  },

  {
    path: 'teacher-request',
    component: TeacherRequestComponent
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeacherRoutingModule { }
