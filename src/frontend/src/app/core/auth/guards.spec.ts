import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, isObservable, Observable, of, throwError } from 'rxjs';

import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { AuthenticatedUser, AuthStatus } from './models';
import { AuthService } from './service';

describe('authentication guards', () => {
  const user: AuthenticatedUser = {
    id: 'c584a5e7-b0fb-445f-aa35-3743255bf5ab',
    email: 'test@example.com',
  };

  let authStatus: WritableSignal<AuthStatus>;
  let loadCurrentUser: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(() => {
    authStatus = signal<AuthStatus>('checking');
    loadCurrentUser = vi.fn(() => of(user));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            authStatus: authStatus.asReadonly(),
            loadCurrentUser,
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('allows an authenticated user through authGuard', () => {
    authStatus.set('authenticated');

    expect(runGuard(authGuard)).toBe(true);
    expect(loadCurrentUser).not.toHaveBeenCalled();
  });

  it('redirects an anonymous user from authGuard to login', () => {
    authStatus.set('anonymous');

    const result = runGuard(authGuard) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/login');
    expect(loadCurrentUser).not.toHaveBeenCalled();
  });

  it('checks the session once when authGuard starts in checking state', async () => {
    const result = runGuard(authGuard);

    expect(isObservable(result)).toBe(true);
    expect(
      await firstValueFrom(result as Observable<boolean | UrlTree>),
    ).toBe(true);
    expect(loadCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('redirects an authenticated user away from guest pages', () => {
    authStatus.set('authenticated');

    const result = runGuard(guestGuard) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/dashboard');
    expect(loadCurrentUser).not.toHaveBeenCalled();
  });

  it('allows an anonymous user to visit guest pages', () => {
    authStatus.set('anonymous');

    expect(runGuard(guestGuard)).toBe(true);
    expect(loadCurrentUser).not.toHaveBeenCalled();
  });

  it('allows a guest page when the session check fails', async () => {
    loadCurrentUser.mockReturnValue(
      throwError(() => new Error('Not authenticated')),
    );

    const result = runGuard(guestGuard);

    expect(isObservable(result)).toBe(true);
    expect(
      await firstValueFrom(result as Observable<boolean | UrlTree>),
    ).toBe(true);
    expect(loadCurrentUser).toHaveBeenCalledTimes(1);
  });

  function runGuard(guard: typeof authGuard | typeof guestGuard) {
    return TestBed.runInInjectionContext(() =>
      guard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );
  }
});
