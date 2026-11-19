import { isDevMode } from '@angular/core';
import { Route } from '@angular/router';
import { AUTH_ROUTES, RESET_ROUTES, authGuard } from '@org/frontend-auth';
import { LEGAL_ROUTES } from '@org/frontend-consent';
import { NotFoundPage } from './not-found.component';

/**
 * Two spaces (PRODUCT §3):
 * - the **public site** at `/` — no account, no sign-in UI;
 * - the **parents' back-office** at `/admin` — sign-in required.
 *
 * The login / password-reset pages stay reachable by URL for the parents
 * but are linked from nowhere on the public site.
 */
export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./public/home-page').then((m) => m.HomePage),
    title: "Coucou, c'est Kiki",
  },
  {
    path: '',
    loadComponent: () =>
      import('./public/public-shell').then((m) => m.PublicShell),
    children: [
      {
        path: 'liste',
        loadComponent: () => import('./public/list-page').then((m) => m.ListPage),
        title: 'La liste',
      },
      {
        path: 'objet/:id',
        loadComponent: () => import('./public/item-page').then((m) => m.ItemPage),
        title: 'Objet',
      },
      {
        path: 'cagnotte',
        loadComponent: () => import('./public/kitty-page').then((m) => m.KittyPage),
        title: 'Cagnotte',
      },
    ],
  },
  // Dev-only showcase of the brand components (DEV step 0.2).
  ...(isDevMode()
    ? [
        {
          path: 'charte',
          loadComponent: () =>
            import('./charter-page').then((m) => m.CharterPage),
          title: 'Charte',
        },
      ]
    : []),
  ...AUTH_ROUTES,
  ...RESET_ROUTES,
  { path: 'legal', children: LEGAL_ROUTES },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@org/frontend-dashboard/shell').then((m) => m.DashboardShell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admin/dashboard-page').then((m) => m.DashboardPage),
        title: 'Tableau de bord',
      },
      {
        path: 'objets',
        loadComponent: () => import('./admin/items-page').then((m) => m.ItemsPage),
        title: 'Objets',
      },
      {
        path: 'objets/nouveau',
        loadComponent: () =>
          import('./admin/item-edit-page').then((m) => m.ItemEditPage),
        title: 'Nouvel objet',
      },
      {
        path: 'objets/:id',
        loadComponent: () =>
          import('./admin/item-edit-page').then((m) => m.ItemEditPage),
        title: 'Objet',
      },
      {
        path: 'participations',
        loadComponent: () =>
          import('./admin/participations-page').then((m) => m.ParticipationsPage),
        title: 'Participations',
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('@org/frontend-features-profile').then(
            (m) => m.PROFILE_ROUTES,
          ),
      },
    ],
  },
  { path: '**', component: NotFoundPage, title: 'Page introuvable' },
];
