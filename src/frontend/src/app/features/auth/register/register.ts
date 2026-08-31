import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly faEyeSlash = faEyeSlash;
  public readonly faEye = faEye;
  public readonly isSubmitting = signal(false);
  public readonly serverError = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);
  public readonly passwordType = signal<'password' | 'text'>('password');
  public readonly confirmPasswordType = signal<'password' | 'text'>('password');

  public readonly registerForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12)],
    }),

    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  public onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const values = this.registerForm.getRawValue();

    if (values.confirmPassword !== values.password) {
      this.registerForm.controls.confirmPassword.setErrors({
        passwordMismatch: true,
      });

      return;
    }

    this.serverError.set(null);
    this.successMessage.set(null);
    this.isSubmitting.set(true);

    const request = {
      email: values.email,
      password: values.password,
    };

    this.authService
      .register(request)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/dashboard');
        },

        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            this.serverError.set(`Registreren is mislukt. Controleer je gegevens en wachtwoord.`);
            return;
          }

          if (error.status === 0) {
            this.serverError.set('De backend is niet bereikbaar.');
            return;
          }

          this.serverError.set('Registreren is mislukt. Probeer het opnieuw.');
        },
      });
  }

  public changePasswordType(): void {
    this.passwordType.update((current) => (current === 'password' ? 'text' : 'password'));
  }

  public changeConfirmPasswordType(): void {
    this.confirmPasswordType.update((current) => (current === 'password' ? 'text' : 'password'));
  }
}
