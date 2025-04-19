import { Routes } from '@angular/router';
import { AddcourseComponent } from './MyBucket/addcourse/addcourse.component';
import { AddCourseContentComponent } from './MyBucket/add-course-content/add-course-content.component';
import { EnrolledCoursesComponent } from './MyBucket/enrolled-courses/enrolled-courses.component';
import { CourseDetailComponent } from './course-detail/course-detail.component';
import { BasicComponent } from './pages/dashboard/basic/basic.component';
import { CourseListComponent } from './course-list/course-list.component';
import { LoginComponent } from './MyBucket/login/login.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'pages/dashboard/basic',
    pathMatch: 'full'
  },
  {
    path: 'pages',
    loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'error',
    loadChildren: () => import('./error/error.module').then(m => m.ErrorModule)
  },
  { path: 'addcourse', component: AddcourseComponent },
  { path: 'enrolled', component: EnrolledCoursesComponent },
  { path: 'courses', component: CourseListComponent },
  { path: 'course/:id', component: CourseDetailComponent },
  { path: 'basic', component: BasicComponent },
  { path: 'login', component: LoginComponent },

  {
    path: '**',
    title: 'Page Not Found',
    loadComponent: () => import('./error/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
