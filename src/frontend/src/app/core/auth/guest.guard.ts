import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from './service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authStatus = authService.authStatus();

  if (authStatus === 'authenticated') {
    return router.createUrlTree(['/dashboard']);
  }

  if (authStatus === 'anonymous') {
    return true;
  }

  return authService.loadCurrentUser().pipe(
    map(() => router.createUrlTree(['/dashboard'])),
    catchError(() => of(true)),
  );
};
