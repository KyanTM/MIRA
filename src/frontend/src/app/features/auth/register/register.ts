import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authService = inject(AuthService);

  public readonly isSubmitting = signal(false);
  public readonly serverError = signal<string | null>(null);
  public readonly successMessage = signal<string | null>(null);

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
        next: (user) => {
          this.successMessage.set(`Je account voor ${user.email} is succesvol aangemaakt!`);
          this.registerForm.reset();
        },

        error: (error: HttpErrorResponse) => {
          if (error.status == 400) {
            this.serverError.set(`Registreren is mislukt. Controleer je gegevens en wachtwoord.`);
          }

          if (error.status === 0) {
            this.serverError.set('De backend is niet bereikbaar.');
            return;
          }

          this.serverError.set('Registreren is mislukt. Probeer het opnieuw.');
        },
      });
  }
}
