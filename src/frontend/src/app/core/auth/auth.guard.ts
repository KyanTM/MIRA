import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from './service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();

  if (authStatus === 'authenticated') {
    return true;
  }

  if (authStatus === 'anonymous') {
    return router.createUrlTree(['/login']);
  }

  return authService.loadCurrentUser().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
