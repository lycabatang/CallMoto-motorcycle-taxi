import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const tabsRoutes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: '',
        redirectTo: 'main',
        pathMatch: 'full'
      },
      {
        path: 'main',
        loadComponent: () => import('../home/home.page').then(m => m.HomePage)
      },
      {
        path: 'activity',
        loadComponent: () => import('../activity/activity.page').then(m => m.ActivityPage)
      },
      {
        path: 'messages',
        loadComponent: () => import('../messages/messages.page').then(m => m.MessagesPage)
      },
      {
        path: 'account',
        loadComponent: () => import('../account/account.page').then(m => m.AccountPage)
      }
    ]
  }
];
