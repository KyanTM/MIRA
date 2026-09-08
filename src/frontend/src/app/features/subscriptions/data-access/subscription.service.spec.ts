import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateSubscriptionRequest,
  SubscriptionDetail,
  SubscriptionSummary,
  UpdateSubscriptionRequest,
} from '../models';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let httpTesting: HttpTestingController;

  const subscriptionId = '6b837cf4-d426-4a36-a8ca-3cc40de51193';

  const subscriptionSummary: SubscriptionSummary = {
    id: subscriptionId,
    name: 'Cloudopslag',
    provider: 'MIRA Cloud',
    price: 9.99,
    billingFrequency: 'Monthly',
    nextBillingDate: '2026-10-01',
    automaticallyRenews: true,
    isActive: true,
    status: 'Active',
    createdAt: '2026-09-01T10:15:30+00:00',
  };

  const subscriptionDetail: SubscriptionDetail = {
    ...subscriptionSummary,
    description: 'Persoonlijk cloudabonnement',
    startDate: '2026-09-01',
    endDate: null,
    trialEndsOn: null,
    cancellationNoticeDays: 30,
    paymentMethod: 'Kredietkaart',
    notes: null,
    contractId: null,
    updatedAt: null,
    archivedAt: null,
  };

  const createRequest: CreateSubscriptionRequest = {
    name: 'Cloudopslag',
    description: 'Persoonlijk cloudabonnement',
    provider: 'MIRA Cloud',
    price: 9.99,
    billingFrequency: 'Monthly',
    startDate: '2026-09-01',
    endDate: null,
    nextBillingDate: '2026-10-01',
    trialEndsOn: null,
    automaticallyRenews: true,
    cancellationNoticeDays: 30,
    paymentMethod: 'Kredietkaart',
    isActive: true,
    notes: null,
    contractId: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SubscriptionService, provideHttpClient(), provideHttpClientTesting()],
    });

    subscriptionService = TestBed.inject(SubscriptionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('gets active subscriptions without an archived query parameter by default', async () => {
    const resultPromise = firstValueFrom(subscriptionService.getSubscriptions());

    const request = httpTesting.expectOne(`${environment.apiUrl}/subscriptions`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('includeArchived')).toBe(false);
    request.flush([subscriptionSummary]);

    expect(await resultPromise).toEqual([subscriptionSummary]);
  });

  it('requests archived subscriptions when includeArchived is true', async () => {
    const resultPromise = firstValueFrom(subscriptionService.getSubscriptions(true));

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/subscriptions?includeArchived=true`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('includeArchived')).toBe('true');
    request.flush([subscriptionSummary]);

    expect(await resultPromise).toEqual([subscriptionSummary]);
  });

  it('gets one subscription by id', async () => {
    const resultPromise = firstValueFrom(subscriptionService.getSubscription(subscriptionId));

    const request = httpTesting.expectOne(`${environment.apiUrl}/subscriptions/${subscriptionId}`);
    expect(request.request.method).toBe('GET');
    request.flush(subscriptionDetail);

    expect(await resultPromise).toEqual(subscriptionDetail);
  });

  it('creates a subscription with the exact request body', async () => {
    const resultPromise = firstValueFrom(subscriptionService.createSubscription(createRequest));

    const request = httpTesting.expectOne(`${environment.apiUrl}/subscriptions`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(createRequest);
    request.flush(subscriptionDetail);

    expect(await resultPromise).toEqual(subscriptionDetail);
  });

  it('updates a subscription with the exact request body', async () => {
    const updateRequest: UpdateSubscriptionRequest = {
      ...createRequest,
      name: 'Bijgewerkte cloudopslag',
      description: null,
    };
    const updatedSubscription: SubscriptionDetail = {
      ...subscriptionDetail,
      name: updateRequest.name,
      description: null,
      updatedAt: '2026-09-04T12:00:00+00:00',
    };
    const resultPromise = firstValueFrom(
      subscriptionService.updateSubscription(subscriptionId, updateRequest),
    );

    const request = httpTesting.expectOne(`${environment.apiUrl}/subscriptions/${subscriptionId}`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(updateRequest);
    request.flush(updatedSubscription);

    expect(await resultPromise).toEqual(updatedSubscription);
  });

  it('archives a subscription with an empty PATCH body', async () => {
    const archivedSubscription: SubscriptionDetail = {
      ...subscriptionDetail,
      status: 'Archived',
      updatedAt: '2026-09-04T12:00:00+00:00',
      archivedAt: '2026-09-04T12:00:00+00:00',
    };
    const resultPromise = firstValueFrom(subscriptionService.archiveSubscription(subscriptionId));

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/subscriptions/${subscriptionId}/archive`,
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    request.flush(archivedSubscription);

    expect(await resultPromise).toEqual(archivedSubscription);
  });

  it('restores a subscription with an empty PATCH body', async () => {
    const resultPromise = firstValueFrom(subscriptionService.restoreSubscription(subscriptionId));

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/subscriptions/${subscriptionId}/restore`,
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    request.flush(subscriptionDetail);

    expect(await resultPromise).toEqual(subscriptionDetail);
  });
});
