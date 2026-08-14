import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);

  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
      ],
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    rememberMe: new FormControl(false, {
      nonNullable: true,
    }),
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.serverError.set(null);
    this.successMessage.set(null);
    this.isSubmitting.set(true);

    const credentials = this.loginForm.getRawValue();

    this.authService
      .login(credentials)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
      )
      .subscribe({
        next: (user) => {
          this.successMessage.set(
            `Je bent aangemeld als ${user.email}.`,
          );
        },

        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.serverError.set(
              'E-mailadres of wachtwoord is onjuist.',
            );
            return;
          }

          if (error.status === 0) {
            this.serverError.set(
              'De backend is niet bereikbaar.',
            );
            return;
          }

          this.serverError.set(
            'Aanmelden is mislukt. Probeer het opnieuw.',
          );
        },
      });
  }
}