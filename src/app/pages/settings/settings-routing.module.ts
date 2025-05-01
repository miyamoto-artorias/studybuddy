import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'basic',
  },
  {
    path: 'credit-card',
    title: 'credit card',
    loadComponent: () => import('./credit-card/credit-card.component').then(c => c.CreditCardComponent)
  },  
  {
    path: 'payment-history',
    title: 'payment history',
    loadComponent: () => import('./payment-history/payment-history.component').then(c => c.PaymentHistoryComponent)
  },
  {path: 'profile',
  title: 'profile',
  loadComponent: () => import('./profile/profile.component').then(c => c.ProfileComponent)}  
 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
