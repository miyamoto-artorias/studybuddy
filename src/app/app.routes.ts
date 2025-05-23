import { Routes } from '@angular/router';
import { CourseDetailComponent } from './pages/course/course-detail/course-detail.component';
import { BasicComponent } from './pages/dashboard/basic/basic.component';
import { CourseListComponent } from './pages/course/course-list/course-list.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
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
  { path: 'courses', component: CourseListComponent },
  { path: 'course/:id', component: CourseDetailComponent },
  { path: 'basic', component: BasicComponent },
  { path: 'login', component: LoginComponent },  {path:'register',component:RegisterComponent},
  {path:'coursedetail',component:CourseDetailComponent},
  {
    path: '**',
    title: 'Page Not Found',
    loadComponent: () => import('./error/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
