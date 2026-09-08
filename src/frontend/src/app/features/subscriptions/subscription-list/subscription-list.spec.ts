import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { SubscriptionService } from '../data-access/subscription.service';
import { SubscriptionSummary } from '../models';
import { SubscriptionList } from './subscription-list';

describe('SubscriptionList', () => {
  let component: SubscriptionList;
  let fixture: ComponentFixture<SubscriptionList>;
  let subscriptionService: {
    getSubscriptions: ReturnType<typeof vi.fn>;
  };

  const subscriptions: SubscriptionSummary[] = [
    {
      id: 'subscription-1',
      name: 'Creative Cloud',
      provider: 'Adobe',
      price: 62.99,
      billingFrequency: 'Monthly',
      nextBillingDate: '2026-09-18',
      automaticallyRenews: true,
      isActive: true,
      status: 'Active',
      createdAt: '2026-08-01T10:00:00Z',
    },
    {
      id: 'subscription-2',
      name: 'Cloudopslag',
      provider: 'Proton',
      price: 47.88,
      billingFrequency: 'Yearly',
      nextBillingDate: null,
      automaticallyRenews: false,
      isActive: false,
      status: 'Active',
      createdAt: '2026-08-02T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    subscriptionService = {
      getSubscriptions: vi.fn().mockReturnValue(of(subscriptions)),
    };

    await TestBed.configureTestingModule({
      imports: [SubscriptionList],
      providers: [
        provideRouter([]),
        { provide: SubscriptionService, useValue: subscriptionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads active subscriptions on creation', () => {
    expect(subscriptionService.getSubscriptions).toHaveBeenCalledWith(false);
    expect(component.subscriptions()).toEqual(subscriptions);
    expect(component.isLoading()).toBe(false);
  });

  it('searches case-insensitively across name and provider', () => {
    component.setSearchTerm('ADOBE');
    expect(component.filteredSubscriptions().map((subscription) => subscription.id)).toEqual([
      'subscription-1',
    ]);

    component.setSearchTerm('cloudopslag');
    expect(component.filteredSubscriptions().map((subscription) => subscription.id)).toEqual([
      'subscription-2',
    ]);
  });

  it('refetches subscriptions when archived items are enabled', () => {
    component.setIncludeArchived(true);

    expect(component.includeArchived()).toBe(true);
    expect(subscriptionService.getSubscriptions).toHaveBeenLastCalledWith(true);
  });

  it('ignores an older response after the archive filter changes again', () => {
    const archivedRequest = new Subject<SubscriptionSummary[]>();
    const activeRequest = new Subject<SubscriptionSummary[]>();
    subscriptionService.getSubscriptions
      .mockReturnValueOnce(archivedRequest)
      .mockReturnValueOnce(activeRequest);

    component.setIncludeArchived(true);
    component.setIncludeArchived(false);

    archivedRequest.next([{ ...subscriptions[0], id: 'stale-subscription', status: 'Archived' }]);
    activeRequest.next(subscriptions);
    activeRequest.complete();

    expect(component.subscriptions()).toEqual(subscriptions);
    expect(component.includeArchived()).toBe(false);
    expect(component.isLoading()).toBe(false);
  });

  it('shows inactive when a current item is no longer running', () => {
    expect(component.displayStatus(subscriptions[1])).toBe('Inactive');
  });
});
