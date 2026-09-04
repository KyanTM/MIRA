import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MockInstance } from 'vitest';

import { SubscriptionService } from '../data-access/subscription.service';
import { SubscriptionDetail, UpdateSubscriptionRequest } from '../models';
import { SubscriptionForm } from '../subscription-form/subscription-form';
import { SubscriptionEdit } from './subscription-edit';

describe('SubscriptionEdit', () => {
  const request: UpdateSubscriptionRequest = {
    name: 'MIRA Cloud',
    description: null,
    provider: 'MIRA',
    price: 8.5,
    billingFrequency: 'Monthly',
    startDate: null,
    endDate: null,
    nextBillingDate: '2026-10-01',
    trialEndsOn: null,
    automaticallyRenews: true,
    cancellationNoticeDays: 14,
    paymentMethod: null,
    isActive: true,
    notes: null,
    contractId: 'contract-1',
  };

  const savedSubscription: SubscriptionDetail = {
    ...request,
    id: 'subscription-1',
    status: 'Active',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-09-04T10:00:00Z',
    archivedAt: null,
  };

  let component: SubscriptionEdit;
  let fixture: ComponentFixture<SubscriptionEdit>;
  let subscriptionService: {
    getSubscription: ReturnType<typeof vi.fn>;
    updateSubscription: ReturnType<typeof vi.fn>;
  };
  let navigate: MockInstance<Router['navigate']>;

  beforeEach(async () => {
    subscriptionService = {
      getSubscription: vi.fn().mockReturnValue(of(savedSubscription)),
      updateSubscription: vi.fn().mockReturnValue(of(savedSubscription)),
    };

    await TestBed.configureTestingModule({
      imports: [SubscriptionEdit],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: savedSubscription.id }) },
          },
        },
        { provide: SubscriptionService, useValue: subscriptionService },
      ],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(SubscriptionEdit);
    component = fixture.componentInstance;
  });

  it('loads the existing abonnement into the reusable form', () => {
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.directive(SubscriptionForm))
      .componentInstance as SubscriptionForm;

    expect(subscriptionService.getSubscription).toHaveBeenCalledWith(savedSubscription.id);
    expect(form.subscription()).toEqual(savedSubscription);
    expect(form.form.controls.name.value).toBe(savedSubscription.name);
    expect(component.isLoading()).toBe(false);
  });

  it('updates the abonnement and opens its detail page', () => {
    component.updateSubscription(request);

    expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(
      savedSubscription.id,
      request,
    );
    expect(navigate).toHaveBeenCalledWith(['/subscriptions', savedSubscription.id], {
      state: { message: 'Wijzigingen opgeslagen.' },
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('shows a not-found state when the abonnement is unavailable', () => {
    subscriptionService.getSubscription.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );

    component.loadSubscription();
    fixture.detectChanges();

    expect(component.notFound()).toBe(true);
    expect(component.subscription()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Abonnement niet gevonden');
  });

  it('shows a useful server error when the update is rejected', () => {
    subscriptionService.updateSubscription.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400 })),
    );

    component.updateSubscription(request);

    expect(component.serverError()).toContain('Controleer de ingevulde gegevens');
    expect(component.isSubmitting()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('blocks duplicate updates while the request is pending', () => {
    const saveRequest = new Subject<SubscriptionDetail>();
    subscriptionService.updateSubscription.mockReturnValue(saveRequest);

    component.updateSubscription(request);
    component.updateSubscription(request);

    expect(subscriptionService.updateSubscription).toHaveBeenCalledTimes(1);
    expect(component.isSubmitting()).toBe(true);

    saveRequest.next(savedSubscription);
    saveRequest.complete();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(component.isSubmitting()).toBe(false);
  });

  it('cancels a pending update when the page is destroyed', () => {
    const saveRequest = new Subject<SubscriptionDetail>();
    subscriptionService.updateSubscription.mockReturnValue(saveRequest);

    component.updateSubscription(request);
    fixture.destroy();
    saveRequest.next(savedSubscription);

    expect(saveRequest.observed).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });
});
