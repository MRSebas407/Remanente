import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login').then((c) => c.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/layout').then((c) => c.Layout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/dashboard').then((c) => c.Dashboard),
      },
      {
        path: 'persons',
        loadComponent: () =>
          import('./persons/person-list').then((c) => c.PersonList),
      },
      {
        path: 'calls',
        loadComponent: () =>
          import('./calls/call-list').then((c) => c.CallList),
      },
      {
        path: 'baptisms',
        loadComponent: () =>
          import('./baptisms/baptism-list').then((c) => c.BaptismList),
      },
      {
        path: 'advisers',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./advisers/adviser-list').then((c) => c.AdviserList),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile').then((c) => c.Profile),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
