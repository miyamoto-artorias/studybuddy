import { Routes } from '@angular/router';
import { AddcourseComponent } from './MyBucket/addcourse/addcourse.component';
import { AddCourseContentComponent } from './MyBucket/add-course-content/add-course-content.component';

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
  {path:'addcourse',component:AddcourseComponent}
,
  {
    path: '**',
    title: 'Page Not Found',
    loadComponent: () => import('./error/not-found/not-found.component').then(c => c.NotFoundComponent)
  }];
