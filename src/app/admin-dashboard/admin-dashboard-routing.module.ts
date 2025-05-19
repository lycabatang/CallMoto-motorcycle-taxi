import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AdminDashboardComponent } from './admin-dashboard';


const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    children: [
      {
        path: 'rider-lists', 
        loadChildren: () => import('../admin/rider-list/rider-list.module').then(m => m.RiderListsModule)
      },
      {
        path: 'customer-lists', 
        loadChildren: () => import('../admin/customer-list/customer-list.module').then(m => m.CustomerListsModule)
      },
      {
        path: 'profile', 
        loadChildren: () => import('../admin/profile/profile.module').then(m => m.ProfileModule)
      },
      {
        path: 'register', 
        loadChildren: () => import('../admin/register/register.module').then(m => m.RegisterModule)
      },
      {
        path: '',
        redirectTo: 'register',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule] // Make sure RouterModule is exported if needed in other modules
})
export class AdminDashboardModule {}
