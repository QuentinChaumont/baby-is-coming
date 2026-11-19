import { inject } from '@angular/core';
import { CanMatchFn, Route, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/** `/register` only matches when the backend allows self-service sign-up
 * (`AUTH_REGISTRATION_ENABLED=true`); otherwise it sends visitors to
 * `/login`. */
export const registrationEnabledGuard: CanMatchFn = () => {
  const router = inject(Router);
  return inject(AuthService)
    .registrationEnabled()
    .pipe(map((enabled) => enabled || router.createUrlTree(['/login'])));
};

/**
 * The unauthenticated auth pages, each lazily loaded into its own chunk.
 * Exported instead of the page components so that importing `AuthService`
 * / `authGuard` eagerly doesn't pull the pages (and `MatFormField` etc.)
 * into the initial bundle.
 *
 * Spread into `appRoutes`: `[...AUTH_ROUTES, ...]`. The `auth-reset` brick
 * adds `RESET_ROUTES` (forgot / reset / verify) alongside.
 */
export const AUTH_ROUTES: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./login/login-page').then((m) => m.LoginPage),
    title: 'Connexion',
  },
  {
    path: 'register',
    canMatch: [registrationEnabledGuard],
    loadComponent: () =>
      import('./register/register-page').then((m) => m.RegisterPage),
    title: 'Créer un compte',
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./callback/oidc-callback').then((m) => m.OidcCallback),
    title: 'Connexion en cours',
  },
];
