import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CreateSubscriptionRequest, SubscriptionDetail } from '../models';
import { SubscriptionForm } from './subscription-form';

describe('SubscriptionForm', () => {
  const existingSubscription: SubscriptionDetail = {
    id: 'subscription-1',
    name: 'MIRA Cloud',
    description: 'Veilige opslag',
    provider: 'MIRA',
    price: 8.5,
    billingFrequency: 'Monthly',
    startDate: '2026-01-01',
    endDate: null,
    nextBillingDate: '2026-10-01',
    trialEndsOn: null,
    automaticallyRenews: true,
    cancellationNoticeDays: 14,
    paymentMethod: 'Gezamenlijke rekening',
    isActive: true,
    notes: null,
    contractId: 'contract-1',
    status: 'Active',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: null,
    archivedAt: null,
  };

  let component: SubscriptionForm;
  let fixture: ComponentFixture<SubscriptionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionForm],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rejects whitespace-only required fields and focuses the first invalid field', () => {
    component.form.controls.name.setValue('   ');
    component.form.controls.provider.setValue('MIRA');
    component.form.controls.price.setValue(8.5);
    component.form.controls.billingFrequency.setValue('Monthly');

    component.submit();
    fixture.detectChanges();

    expect(component.form.controls.name.hasError('whitespace')).toBe(true);
    expect(component.showValidationSummary()).toBe(true);
    expect(document.activeElement?.id).toBe('subscription-name');
    expect(fixture.nativeElement.textContent).toContain('Vul een naam in');
  });

  it('rejects an end date before the start date and focuses the end date', () => {
    component.form.patchValue({
      name: 'MIRA Cloud',
      provider: 'MIRA',
      price: 8.5,
      billingFrequency: 'Monthly',
      startDate: '2026-09-10',
      endDate: '2026-09-01',
    });

    component.submit();
    fixture.detectChanges();

    expect(component.form.hasError('dateOrder')).toBe(true);
    expect(document.activeElement?.id).toBe('subscription-end-date');
    expect(fixture.nativeElement.textContent).toContain(
      'De einddatum mag niet vóór de startdatum liggen',
    );
  });

  it('trims text, converts empty optional values to null and emits a valid request', () => {
    let submittedRequest: CreateSubscriptionRequest | undefined;
    component.submitted.subscribe((request) => (submittedRequest = request));
    component.form.setValue({
      name: '  MIRA Cloud  ',
      description: '  Veilige opslag  ',
      provider: '  MIRA  ',
      price: 0,
      billingFrequency: 'Monthly',
      paymentMethod: '   ',
      startDate: '',
      endDate: '',
      nextBillingDate: '2026-10-01',
      trialEndsOn: '',
      automaticallyRenews: true,
      cancellationNoticeDays: 0,
      isActive: true,
      notes: '',
    });

    component.submit();

    expect(submittedRequest).toEqual({
      name: 'MIRA Cloud',
      description: 'Veilige opslag',
      provider: 'MIRA',
      price: 0,
      billingFrequency: 'Monthly',
      startDate: null,
      endDate: null,
      nextBillingDate: '2026-10-01',
      trialEndsOn: null,
      automaticallyRenews: true,
      cancellationNoticeDays: 0,
      paymentMethod: null,
      isActive: true,
      notes: null,
      contractId: null,
    });
  });

  it('loads existing data and preserves its hidden contract link when editing', () => {
    let submittedRequest: CreateSubscriptionRequest | undefined;
    component.submitted.subscribe((request) => (submittedRequest = request));

    fixture.componentRef.setInput('subscription', existingSubscription);
    fixture.detectChanges();

    expect(component.form.controls.name.value).toBe(existingSubscription.name);
    expect(component.form.controls.billingFrequency.value).toBe('Monthly');

    component.submit();

    expect(submittedRequest?.contractId).toBe(existingSubscription.contractId);
  });

  it('does not emit or offer an active cancel link while saving', () => {
    const submitted = vi.fn();
    component.submitted.subscribe(submitted);
    fixture.componentRef.setInput('isSubmitting', true);
    fixture.detectChanges();

    component.submit();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-disabled="true"]')?.textContent).toContain(
      'Annuleren',
    );
  });
});
