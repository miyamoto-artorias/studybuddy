import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'widgets',
    loadChildren: () => import('./widgets/widgets.module').then(m => m.WidgetsModule)
  },
  {
    path: 'skeleton',
    loadChildren: () => import('./skeleton/skeleton.module').then(m => m.SkeletonModule)
  },
  {
    path: 'sidebar-widgets',
    loadChildren: () => import('./sidebar-widgets/sidebar.module').then(m => m.SidebarModule)
  },
  {
    path: 'notifications',
    loadChildren: () => import('./notifications/notifications.module').then(m => m.NotificationsModule)
  },
  {
    path: 'selects',
    loadChildren: () => import('./selects/selects.module').then(m => m.SelectsModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StoreRoutingModule { }
