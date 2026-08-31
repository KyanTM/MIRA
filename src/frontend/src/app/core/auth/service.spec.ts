import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthenticatedUser, LoginRequest } from './models';
import { AuthService } from './service';

describe('AuthService', () => {
  let authService: AuthService;
  let httpTesting: HttpTestingController;

  const user: AuthenticatedUser = {
    id: 'c584a5e7-b0fb-445f-aa35-3743255bf5ab',
    email: 'test@example.com',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    authService = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('starts in the checking state without a current user', () => {
    expect(authService.authStatus()).toBe('checking');
    expect(authService.currentUser()).toBeNull();
  });

  it('stores the authenticated user after a successful login', async () => {
    const loginRequest: LoginRequest = {
      email: user.email,
      password: 'Password123!',
      rememberMe: false,
    };

    const resultPromise = firstValueFrom(authService.login(loginRequest));

    const request = httpTesting.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(loginRequest);
    request.flush(user);

    expect(await resultPromise).toEqual(user);
    expect(authService.currentUser()).toEqual(user);
    expect(authService.authStatus()).toBe('authenticated');
  });

  it('shares one current-user request between multiple subscribers', async () => {
    const firstResult = firstValueFrom(authService.loadCurrentUser());
    const secondResult = firstValueFrom(authService.loadCurrentUser());

    const requests = httpTesting.match(`${environment.apiUrl}/auth/me`);
    expect(requests).toHaveLength(1);
    requests[0].flush(user);

    expect(await firstResult).toEqual(user);
    expect(await secondResult).toEqual(user);
    expect(authService.authStatus()).toBe('authenticated');

    expect(await firstValueFrom(authService.loadCurrentUser())).toEqual(user);
    httpTesting.expectNone(`${environment.apiUrl}/auth/me`);
  });

  it('clears the local authentication state after logout', async () => {
    const loginResult = firstValueFrom(
      authService.login({
        email: user.email,
        password: 'Password123!',
        rememberMe: false,
      }),
    );

    httpTesting.expectOne(`${environment.apiUrl}/auth/login`).flush(user);
    await loginResult;

    const logoutResult = firstValueFrom(authService.logout());
    const request = httpTesting.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush(null);
    await logoutResult;

    expect(authService.currentUser()).toBeNull();
    expect(authService.authStatus()).toBe('anonymous');
  });
});
