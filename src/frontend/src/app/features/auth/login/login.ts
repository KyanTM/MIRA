import { Component } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email
      ]
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required
      ]
    }),

    rememberMe: new FormControl(false, {nonNullable: true})    
  });

  onSubmit(): void {
      if (this.loginForm.invalid) {
        this.loginForm.markAllAsTouched();
        return;
      }
      
      const credentials = this.loginForm.getRawValue();

      console.log(credentials);
    }
}
