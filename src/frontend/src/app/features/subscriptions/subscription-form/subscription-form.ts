import { ContractPicker } from '../../records/contract-picker';
import { Component, ElementRef, effect, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BillingFrequency, CreateSubscriptionRequest, SubscriptionDetail } from '../models';

const nonWhitespaceValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  return String(control.value ?? '').trim().length === 0 ? { whitespace: true } : null;
};

const wholeNumberValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === '') {
    return null;
  }

  return Number.isInteger(Number(value)) ? null : { wholeNumber: true };
};

const dateOrderValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;

  if (!startDate || !endDate) {
    return null;
  }

  return endDate < startDate ? { dateOrder: true } : null;
};

@Component({
  selector: 'app-subscription-form',
  imports: [ReactiveFormsModule, RouterLink, ContractPicker],
  templateUrl: './subscription-form.html',
  styleUrl: './subscription-form.css',
})
export class SubscriptionForm {
  private readonly hostElement: ElementRef<HTMLElement> = inject(ElementRef);

  readonly subscription = input<SubscriptionDetail | null>(null);
  readonly submitLabel = input('Abonnement opslaan');
  readonly cancelLink = input('/subscriptions');
  readonly isSubmitting = input(false);
  readonly serverError = input<string | null>(null);
  readonly submitted = output<CreateSubscriptionRequest>();
  readonly showValidationSummary = signal(false);

  readonly form = new FormGroup(
    {
      contractId: new FormControl('', { nonNullable: true }),
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, nonWhitespaceValidator, Validators.maxLength(200)],
      }),
      description: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(2000)],
      }),
      provider: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, nonWhitespaceValidator, Validators.maxLength(200)],
      }),
      price: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      billingFrequency: new FormControl<BillingFrequency | ''>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      paymentMethod: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(100)],
      }),
      startDate: new FormControl('', { nonNullable: true }),
      endDate: new FormControl('', { nonNullable: true }),
      nextBillingDate: new FormControl('', { nonNullable: true }),
      trialEndsOn: new FormControl('', { nonNullable: true }),
      automaticallyRenews: new FormControl(false, { nonNullable: true }),
      cancellationNoticeDays: new FormControl<number | null>(null, {
        validators: [Validators.min(0), wholeNumberValidator],
      }),
      isActive: new FormControl(true, { nonNullable: true }),
      notes: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(2000)],
      }),
    },
    { validators: [dateOrderValidator] },
  );

  constructor() {
    effect(() => {
      const subscription = this.subscription();

      if (subscription === null) {
        return;
      }

      this.form.reset({
        contractId: subscription.contractId ?? '',
        name: subscription.name,
        description: subscription.description ?? '',
        provider: subscription.provider,
        price: subscription.price,
        billingFrequency: subscription.billingFrequency,
        paymentMethod: subscription.paymentMethod ?? '',
        startDate: subscription.startDate ?? '',
        endDate: subscription.endDate ?? '',
        nextBillingDate: subscription.nextBillingDate ?? '',
        trialEndsOn: subscription.trialEndsOn ?? '',
        automaticallyRenews: subscription.automaticallyRenews,
        cancellationNoticeDays: subscription.cancellationNoticeDays,
        isActive: subscription.isActive,
        notes: subscription.notes ?? '',
      });
    });
  }

  submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showValidationSummary.set(true);
      this.focusFirstInvalidControl();
      return;
    }

    this.showValidationSummary.set(false);
    const value = this.form.getRawValue();

    this.submitted.emit({
      name: value.name.trim(),
      description: this.normalizeOptionalText(value.description),
      provider: value.provider.trim(),
      price: value.price as number,
      billingFrequency: value.billingFrequency as BillingFrequency,
      startDate: value.startDate || null,
      endDate: value.endDate || null,
      nextBillingDate: value.nextBillingDate || null,
      trialEndsOn: value.trialEndsOn || null,
      automaticallyRenews: value.automaticallyRenews,
      cancellationNoticeDays: value.cancellationNoticeDays,
      paymentMethod: this.normalizeOptionalText(value.paymentMethod),
      isActive: value.isActive,
      notes: this.normalizeOptionalText(value.notes),
      contractId: value.contractId || null,
    });
  }

  isInvalid(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  isDateOrderInvalid(): boolean {
    return (
      this.form.hasError('dateOrder') &&
      (this.form.controls.startDate.touched || this.form.controls.endDate.touched)
    );
  }

  private normalizeOptionalText(value: string): string | null {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private focusFirstInvalidControl(): void {
    const firstInvalidControlName = Object.entries(this.form.controls).find(
      ([, control]) => control.invalid,
    )?.[0];

    const controlName =
      firstInvalidControlName ?? (this.form.hasError('dateOrder') ? 'endDate' : null);

    if (controlName === null) {
      return;
    }

    this.hostElement.nativeElement
      .querySelector<HTMLElement>(`[formcontrolname="${controlName}"]`)
      ?.focus();
  }
}
