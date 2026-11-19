import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService, AuthStore } from '@org/frontend-auth';
import { of } from 'rxjs';
import { provideTranslocoTesting } from '@org/frontend-i18n';
import { UserMenu } from './user-menu';

interface MenuInternals {
  roleLabel(): string;
  signOut(): void;
}

describe('UserMenu', () => {
  const navigate = jest.fn();
  const logout = jest.fn(() => of(undefined));

  function build(): MenuInternals {
    navigate.mockReset();
    logout.mockClear();
    TestBed.configureTestingModule({
      imports: [UserMenu],
      providers: [
        provideTranslocoTesting(),
        { provide: Router, useValue: { navigate } },
        { provide: AuthService, useValue: { logout } },
      ],
    });
    const fixture = TestBed.createComponent(UserMenu);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as MenuInternals;
  }

  it('labels the menu with the user roles, else "Signed in"', () => {
    const menu = build();
    expect(menu.roleLabel()).toBe('Signed in');
    TestBed.inject(AuthStore).setSession('t', { id: 'u1', roles: ['admin'] });
    expect(menu.roleLabel()).toBe('admin');
  });

  it('signs out then routes to /login', () => {
    build().signOut();
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
