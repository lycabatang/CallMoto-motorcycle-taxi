import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { RiderDashboardComponent } from './rider-dashboard.component'; // Parent component


const routes: Routes = [
  {
    path: '',
    component: RiderDashboardComponent,
    children: [
      {
        path: 'active-rides', 
        loadChildren: () => import('../rider-dashboard/components/active-rides/active-rides.module').then(m => m.ActiveRidesModule)
      },
      {
        path: 'ride-history', 
        loadChildren: () => import('../rider-dashboard/components/ride-history/ride-history.module').then(m => m.RideHistoryModule)
      },
      {
        path: 'profile', 
        loadChildren: () => import('../rider-dashboard/components/profile/profile.module').then(m => m.ProfileModule)
      },
      {
        path: 'notifications', 
        loadChildren: () => import('../rider-dashboard/components/notifications/notifications.module').then(m => m.NotificationsModule)
      },
      {
        path: 'chat', 
        loadChildren: () => import('../rider-dashboard/components/chat/chat.module').then(m => m.ChatModule)
      },
      {
        path: '',
        redirectTo: 'active-rides',
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
export class RiderDashboardModule {}
