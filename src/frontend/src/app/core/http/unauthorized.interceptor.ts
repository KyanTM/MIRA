import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/service';

const EXPECTED_UNAUTHORIZED_ENDPOINTS = [
  `${environment.apiUrl}/auth/login`,
  `${environment.apiUrl}/auth/register`,
  `${environment.apiUrl}/auth/me`,
];

export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest =
    request.url === environment.apiUrl ||
    request.url.startsWith(`${environment.apiUrl}/`);

  if (!isApiRequest) {
    return next(request);
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.markAnonymous();

        const isExpectedUnauthorized = EXPECTED_UNAUTHORIZED_ENDPOINTS.includes(request.url);

        if (!isExpectedUnauthorized) {
          void router.navigateByUrl('/login');
        }
      }

      return throwError(() => error);
    }),
  );
};
