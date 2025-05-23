import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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
 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
