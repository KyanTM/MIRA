import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MockInstance } from 'vitest';

import { SubscriptionService } from '../data-access/subscription.service';
import { CreateSubscriptionRequest, SubscriptionDetail } from '../models';
import { SubscriptionCreate } from './subscription-create';

describe('SubscriptionCreate', () => {
  const request: CreateSubscriptionRequest = {
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
    contractId: null,
  };

  const createdSubscription: SubscriptionDetail = {
    ...request,
    id: 'subscription-1',
    status: 'Active',
    createdAt: '2026-09-04T10:00:00Z',
    updatedAt: null,
    archivedAt: null,
  };

  let component: SubscriptionCreate;
  let fixture: ComponentFixture<SubscriptionCreate>;
  let subscriptionService: { createSubscription: ReturnType<typeof vi.fn> };
  let navigate: MockInstance<Router['navigate']>;

  beforeEach(async () => {
    subscriptionService = {
      createSubscription: vi.fn().mockReturnValue(of(createdSubscription)),
    };

    await TestBed.configureTestingModule({
      imports: [SubscriptionCreate],
      providers: [
        provideRouter([]),
        { provide: SubscriptionService, useValue: subscriptionService },
      ],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(SubscriptionCreate);
    component = fixture.componentInstance;
  });

  it('creates an abonnement and opens its detail page', () => {
    component.createSubscription(request);

    expect(subscriptionService.createSubscription).toHaveBeenCalledWith(request);
    expect(navigate).toHaveBeenCalledWith(['/subscriptions', createdSubscription.id], {
      state: { message: 'Abonnement toegevoegd.' },
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('blocks duplicate submissions while the save request is pending', () => {
    const saveRequest = new Subject<SubscriptionDetail>();
    subscriptionService.createSubscription.mockReturnValue(saveRequest);

    component.createSubscription(request);
    component.createSubscription(request);

    expect(component.isSubmitting()).toBe(true);
    expect(subscriptionService.createSubscription).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();

    saveRequest.next(createdSubscription);
    saveRequest.complete();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(component.isSubmitting()).toBe(false);
  });

  it('shows a useful validation error and allows retrying', () => {
    subscriptionService.createSubscription.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 400 })),
    );

    component.createSubscription(request);

    expect(component.serverError()).toContain('Controleer de ingevulde gegevens');
    expect(component.isSubmitting()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();

    component.createSubscription(request);

    expect(subscriptionService.createSubscription).toHaveBeenCalledTimes(2);
    expect(component.serverError()).toBeNull();
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending save when the page is destroyed', () => {
    const saveRequest = new Subject<SubscriptionDetail>();
    subscriptionService.createSubscription.mockReturnValue(saveRequest);

    component.createSubscription(request);
    fixture.destroy();
    saveRequest.next(createdSubscription);

    expect(saveRequest.observed).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });
});
