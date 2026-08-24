import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AntiforgeryService } from './antiforgery.service';

const METHODS_REQUIRING_ANTIFORGERY = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest =
    request.url === environment.apiUrl ||
    request.url.startsWith(`${environment.apiUrl}/`);

  if (!isApiRequest) {
    return next(request);
  }

  const requestWithCredentials = request.clone({
    withCredentials: true,
  });

  const requiresAntiforgeryToken =
    METHODS_REQUIRING_ANTIFORGERY.includes(request.method.toUpperCase());

  if (!requiresAntiforgeryToken) {
    return next(requestWithCredentials);
  }

  const antiforgeryService = inject(AntiforgeryService);

  return antiforgeryService.getToken().pipe(
    switchMap((token) =>
      next(
        requestWithCredentials.clone({
          setHeaders: {
            'X-XSRF-TOKEN': token,
          },
        }),
      ),
    ),
  );
};