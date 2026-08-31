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

import { ImagePicker, ImageSelection } from '../../../shared/ui/image-picker/image-picker';
import { AssetDetail, CreateAssetRequest } from '../models';

const nonWhitespaceValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  return String(control.value ?? '').trim().length === 0 ? { whitespace: true } : null;
};

@Component({
  selector: 'app-asset-form',
  imports: [ImagePicker, ReactiveFormsModule, RouterLink],
  templateUrl: './asset-form.html',
  styleUrl: './asset-form.css',
})
export class AssetForm {
  private readonly hostElement: ElementRef<HTMLElement> = inject(ElementRef);

  readonly asset = input<AssetDetail | null>(null);
  readonly submitLabel = input('Bezitting opslaan');
  readonly cancelLink = input('/assets');
  readonly isSubmitting = input(false);
  readonly serverError = input<string | null>(null);
  readonly submitted = output<CreateAssetRequest>();
  readonly imageSelected = output<File | null>();
  readonly imageError = signal<string | null>(null);
  readonly showValidationSummary = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, nonWhitespaceValidator, Validators.maxLength(200)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
    brand: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    model: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    serialNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    purchaseDate: new FormControl('', { nonNullable: true }),
    purchasePrice: new FormControl<number | null>(null, {
      validators: [Validators.min(0)],
    }),
    seller: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    }),
    location: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    }),
    currentValue: new FormControl<number | null>(null, {
      validators: [Validators.min(0)],
    }),
  });

  constructor() {
    effect(() => {
      const asset = this.asset();

      if (asset === null) {
        return;
      }

      this.form.reset({
        name: asset.name,
        description: asset.description ?? '',
        brand: asset.brand ?? '',
        model: asset.model ?? '',
        serialNumber: asset.serialNumber ?? '',
        purchaseDate: asset.purchaseDate ?? '',
        purchasePrice: asset.purchasePrice,
        seller: asset.seller ?? '',
        location: asset.location ?? '',
        currentValue: asset.currentValue,
      });
    });
  }

  onSubmit(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.form.invalid || this.imageError()) {
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
      brand: this.normalizeOptionalText(value.brand),
      model: this.normalizeOptionalText(value.model),
      serialNumber: this.normalizeOptionalText(value.serialNumber),
      purchaseDate: value.purchaseDate || null,
      purchasePrice: value.purchasePrice,
      seller: this.normalizeOptionalText(value.seller),
      location: this.normalizeOptionalText(value.location),
      currentValue: value.currentValue,
    });
  }

  onImageSelected(selection: ImageSelection): void {
    this.imageError.set(selection.error);
    this.imageSelected.emit(selection.error ? null : selection.file);
  }

  isInvalid(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  private normalizeOptionalText(value: string): string | null {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private focusFirstInvalidControl(): void {
    const firstInvalidControlName = Object.entries(this.form.controls).find(
      ([, control]) => control.invalid,
    )?.[0];

    if (firstInvalidControlName === undefined) {
      if (this.imageError()) {
        this.hostElement.nativeElement.querySelector<HTMLElement>('#asset-image')?.focus();
      }

      return;
    }

    this.hostElement.nativeElement
      .querySelector<HTMLElement>(`[formcontrolname="${firstInvalidControlName}"]`)
      ?.focus();
  }
}
