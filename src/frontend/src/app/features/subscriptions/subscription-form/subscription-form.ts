import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CreateSubscriptionRequest, SubscriptionDetail } from '../models';

@Component({
  selector: 'app-subscription-form',
  imports: [ReactiveFormsModule],
  templateUrl: './subscription-form.html',
  styleUrl: './subscription-form.css',
})
export class SubscriptionForm {
  readonly subscription = input<SubscriptionDetail | null>(null);
  readonly submitLabel = input('Abonnement opslaan');
  readonly isSubmitting = input(false);
  readonly serverError = input<string | null>(null);
  readonly submitted = output<CreateSubscriptionRequest>();

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    provider: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),

    // ===== JOUW CODE — leerstap 5A =====
    // Voeg hier stap voor stap de overige FormControls toe.
    // Begin met price en billingFrequency; voeg de optionele velden pas daarna toe.
    // ===== EINDE JOUW CODE =====
  });

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    // ===== JOUW CODE — leerstap 5B =====
    // Bouw een CreateSubscriptionRequest op basis van getRawValue().
    // Zet lege optionele tekstvelden om naar null en emit daarna het request.
    // ===== EINDE JOUW CODE =====
  }
}
