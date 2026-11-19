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
    loadComponent: () => import('./public-home').then((m) => m.PublicHome),
    title: "Coucou, c'est Kiki",
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
