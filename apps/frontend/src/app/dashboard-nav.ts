import { NavItem } from '@org/frontend-dashboard';

/**
 * Sidenav menu of the parents' back-office (`/admin`). Routes are relative
 * to `/admin`. Business entries (objets, participations, cagnotte,
 * réglages) are added by the phase 4 steps of `docs/DEV.md`.
 *
 * See `NavItem` in `@org/frontend-dashboard` for the full shape.
 */
export const DASHBOARD_NAV: NavItem[] = [
  { label: 'Tableau de bord', labelKey: 'dashboard.nav.home', icon: 'home', route: '' },
];
