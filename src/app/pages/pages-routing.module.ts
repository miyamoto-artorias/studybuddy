import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./common/common.component').then(c => c.CommonComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {path: 'teacher',
      loadChildren: () => import('./teacher/teacher.module').then(m => m.TeacherModule)},
      {
        path: 'course',
        loadChildren: () => import('./course/course.module').then(m => m.CourseModule)
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
      },
   
    
  
   
      {path: 'settings',
      loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule)},
      {path: 'course-request',
      loadChildren: () => import('./course-request/course-request.module').then(m => m.CourseRequestModule)
    }

    
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
