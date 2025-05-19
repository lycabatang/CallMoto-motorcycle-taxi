// rider-dashboard-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RiderDashboardComponent } from './rider-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: RiderDashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'active-rides',
        pathMatch: 'full'
      },
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
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RiderDashboardRoutingModule {}
