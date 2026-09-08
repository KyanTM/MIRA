import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBoxArchive,
  faFileContract,
  faFileLines,
  faHouse,
  faRepeat,
  faRightFromBracket,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isLoggingOut = signal(false);
  readonly logoutError = signal<string | null>(null);

  readonly contractsIcon = faFileContract;
  readonly documentsIcon = faFileLines;
  readonly dashboardIcon = faHouse;
  readonly assetsIcon = faBoxArchive;
  readonly subscriptionsIcon = faRepeat;
  readonly securityIcon = faShieldHalved;
  readonly logoutIcon = faRightFromBracket;

  onLogout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.logoutError.set(null);
    this.isLoggingOut.set(true);

    this.authService
      .logout()
      .pipe(finalize(() => this.isLoggingOut.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/login');
        },
        error: () => {
          this.logoutError.set('Afmelden is mislukt. Probeer het opnieuw.');
        },
      });
  }
}
