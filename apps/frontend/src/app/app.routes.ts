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
        loadComponent: () =>
          import('./public/placeholder-page').then((m) => m.PlaceholderPage),
        data: { heading: 'La liste' },
        title: 'La liste',
      },
      {
        path: 'objet/:id',
        loadComponent: () =>
          import('./public/placeholder-page').then((m) => m.PlaceholderPage),
        data: { heading: 'Un objet de la liste' },
        title: 'Objet',
      },
      {
        path: 'cagnotte',
        loadComponent: () =>
          import('./public/placeholder-page').then((m) => m.PlaceholderPage),
        data: { heading: "La cagnotte « J'ai la flemme »" },
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
          import('@org/frontend-dashboard/home').then((m) => m.DashboardHome),
        title: 'Tableau de bord',
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
