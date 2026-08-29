import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthenticatedUser } from '../auth/models';
import { AuthService } from '../auth/service';
import { unauthorizedInterceptor } from './unauthorized.interceptor';

describe('unauthorizedInterceptor', () => {
  let authService: AuthService;
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let router: Router;

  const user: AuthenticatedUser = {
    id: 'c584a5e7-b0fb-445f-aa35-3743255bf5ab',
    email: 'test@example.com',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([unauthorizedInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    authService = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.restoreAllMocks();
  });

  it('clears the user and redirects after a protected API request returns 401', async () => {
    await authenticateUser();
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const resultPromise = firstValueFrom(
      http.get(`${environment.apiUrl}/assets`),
    );
    const rejection = expect(resultPromise).rejects.toBeInstanceOf(HttpErrorResponse);

    httpTesting.expectOne(`${environment.apiUrl}/assets`).flush(null, {
      status: 401,
      statusText: 'Unauthorized',
    });

    await rejection;
    expect(authService.currentUser()).toBeNull();
    expect(authService.authStatus()).toBe('anonymous');
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });

  it('does not redirect when incorrect login credentials return 401', async () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const resultPromise = firstValueFrom(
      authService.login({
        email: user.email,
        password: 'wrong-password',
        rememberMe: false,
      }),
    );
    const rejection = expect(resultPromise).rejects.toBeInstanceOf(HttpErrorResponse);

    httpTesting.expectOne(`${environment.apiUrl}/auth/login`).flush(null, {
      status: 401,
      statusText: 'Unauthorized',
    });

    await rejection;
    expect(authService.authStatus()).toBe('anonymous');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('does not change the MIRA session for an external 401 response', async () => {
    await authenticateUser();
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const externalUrl = 'https://example.com/private';
    const resultPromise = firstValueFrom(http.get(externalUrl));
    const rejection = expect(resultPromise).rejects.toBeInstanceOf(HttpErrorResponse);

    httpTesting.expectOne(externalUrl).flush(null, {
      status: 401,
      statusText: 'Unauthorized',
    });

    await rejection;
    expect(authService.currentUser()).toEqual(user);
    expect(authService.authStatus()).toBe('authenticated');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  async function authenticateUser(): Promise<void> {
    const resultPromise = firstValueFrom(
      authService.login({
        email: user.email,
        password: 'Password123!',
        rememberMe: false,
      }),
    );

    httpTesting.expectOne(`${environment.apiUrl}/auth/login`).flush(user);
    await resultPromise;
  }
});
