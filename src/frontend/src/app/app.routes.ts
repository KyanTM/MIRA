import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((module) => module.Login),
    canActivate: [guestGuard],
    title: 'Aanmelden | MIRA',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then((module) => module.Register),
    canActivate: [guestGuard],
    title: 'Account aanmaken | MIRA',
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/app-shell/app-shell').then((module) => module.AppShell),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((module) => module.Dashboard),
        title: 'Overzicht | MIRA',
      },
      {
        path: 'assets',
        loadComponent: () =>
          import('./features/assets/asset-list/asset-list').then((module) => module.AssetList),
        title: 'Bezittingen | MIRA',
      },
      {
        path: 'assets/new',
        loadComponent: () =>
          import('./features/assets/asset-create/asset-create').then(
            (module) => module.AssetCreate,
          ),
        title: 'Nieuwe bezitting | MIRA',
      },
      {
        path: 'assets/:id/edit',
        loadComponent: () =>
          import('./features/assets/asset-edit/asset-edit').then((module) => module.AssetEdit),
        title: 'Bezitting bewerken | MIRA',
      },
      {
        path: 'assets/:id',
        loadComponent: () =>
          import('./features/assets/asset-detail/asset-detail').then(
            (module) => module.AssetDetailPage,
          ),
        title: 'Bezitting | MIRA',
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];
