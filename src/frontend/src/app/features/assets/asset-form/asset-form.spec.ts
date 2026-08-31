import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CreateAssetRequest } from '../models';
import { AssetForm } from './asset-form';

describe('AssetForm', () => {
  let component: AssetForm;
  let fixture: ComponentFixture<AssetForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetForm],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rejects an empty or whitespace-only name', () => {
    component.form.controls.name.setValue('   ');
    component.onSubmit();

    expect(component.form.controls.name.hasError('whitespace')).toBe(true);
    expect(component.form.controls.name.touched).toBe(true);
    expect(component.showValidationSummary()).toBe(true);
    expect(document.activeElement?.id).toBe('asset-name');

    component.form.controls.name.setValue('Laptop');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Controleer de gemarkeerde velden');
  });

  it('trims text, converts empty optional fields to null and preserves zero', () => {
    let submittedRequest: CreateAssetRequest | undefined;
    component.submitted.subscribe((request) => (submittedRequest = request));

    component.form.setValue({
      name: '  Laptop  ',
      description: '  Werktoestel  ',
      brand: '  ',
      model: 'X1',
      serialNumber: '',
      purchaseDate: '2026-08-29',
      purchasePrice: 0,
      seller: '',
      location: '  Bureau  ',
      currentValue: 0,
    });

    component.onSubmit();

    expect(submittedRequest).toEqual({
      name: 'Laptop',
      description: 'Werktoestel',
      brand: null,
      model: 'X1',
      serialNumber: null,
      purchaseDate: '2026-08-29',
      purchasePrice: 0,
      seller: null,
      location: 'Bureau',
      currentValue: 0,
    });
  });

  it('disables cancellation while a save request is in progress', () => {
    fixture.componentRef.setInput('isSubmitting', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-disabled="true"]')?.textContent).toContain(
      'Annuleren',
    );
    expect(fixture.nativeElement.querySelector('#asset-image')?.disabled).toBe(true);
  });

  it('emits the selected image separately from the asset request', () => {
    const file = new File(['photo'], 'laptop.png', { type: 'image/png' });
    const selected = vi.fn();
    const submitted = vi.fn();
    component.imageSelected.subscribe(selected);
    component.submitted.subscribe(submitted);
    component.form.controls.name.setValue('Laptop');

    component.onImageSelected({ file, error: null });
    component.onSubmit();

    expect(selected).toHaveBeenCalledWith(file);
    expect(submitted).toHaveBeenCalledWith(expect.objectContaining({ name: 'Laptop' }));
    expect(submitted.mock.calls[0][0]).not.toHaveProperty('file');
    expect(component.imageError()).toBeNull();
  });

  it('blocks an invalid image and focuses its input when the other fields are valid', () => {
    const submitted = vi.fn();
    const selected = vi.fn();
    component.submitted.subscribe(submitted);
    component.imageSelected.subscribe(selected);
    component.form.controls.name.setValue('Laptop');

    component.onImageSelected({ file: null, error: 'Kies een PNG-, JPEG- of WebP-afbeelding.' });
    component.onSubmit();
    fixture.detectChanges();

    expect(submitted).not.toHaveBeenCalled();
    expect(selected).toHaveBeenCalledWith(null);
    expect(component.showValidationSummary()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Controleer de gemarkeerde velden');
    expect(document.activeElement?.id).toBe('asset-image');

    component.onImageSelected({ file: null, error: null });
    component.onSubmit();
    fixture.detectChanges();

    expect(submitted).toHaveBeenCalledTimes(1);
    expect(component.imageError()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Controleer de gemarkeerde velden');
  });

  it('focuses the first invalid form field before an invalid image', () => {
    component.onImageSelected({ file: null, error: 'Deze afbeelding is te groot.' });

    component.onSubmit();

    expect(document.activeElement?.id).toBe('asset-name');
  });
});
