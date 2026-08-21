import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/auth/service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  readonly isLoggingOut = signal(false);
  readonly logoutError = signal<string | null>(null);

  onLogout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.logoutError.set(null);
    this.isLoggingOut.set(true);

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.isLoggingOut.set(false);
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/login');
        },

        error: (error: HttpErrorResponse) => {
          if (error.status === 0) {
            this.logoutError.set('De backend is niet bereikbaar. Afmelden is niet voltooid.');
            return;
          }

          this.logoutError.set('Afmelden is mislukt. Probeer het opnieuw.');
        },
      });
  }
}
