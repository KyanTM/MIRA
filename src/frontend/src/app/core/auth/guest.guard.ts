import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from './service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()) {
    return router.createUrlTree(['/dashboard']);
  }

  return authService.loadCurrentUser().pipe(
    map(() => router.createUrlTree(['/dashboard'])),
    catchError(() => of(true)),
  );
};
