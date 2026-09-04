import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SubscriptionService } from '../data-access/subscription.service';
import { SubscriptionDetail } from '../models';
import { SubscriptionDetailPage } from './subscription-detail';

describe('SubscriptionDetailPage', () => {
  let fixture: ComponentFixture<SubscriptionDetailPage>;
  let component: SubscriptionDetailPage;
  let subscriptionService: {
    getSubscription: ReturnType<typeof vi.fn>;
    archiveSubscription: ReturnType<typeof vi.fn>;
    restoreSubscription: ReturnType<typeof vi.fn>;
  };

  const subscription: SubscriptionDetail = {
    id: 'subscription-1',
    name: 'Creative Cloud',
    description: 'Ontwerpsoftware',
    provider: 'Adobe',
    price: 62.99,
    billingFrequency: 'Monthly',
    startDate: '2026-01-01',
    endDate: null,
    nextBillingDate: '2026-09-18',
    trialEndsOn: null,
    automaticallyRenews: true,
    cancellationNoticeDays: 30,
    paymentMethod: 'Kredietkaart',
    isActive: true,
    notes: null,
    contractId: null,
    status: 'Active',
    createdAt: '2026-08-29T12:00:00Z',
    updatedAt: null,
    archivedAt: null,
  };

  beforeEach(async () => {
    subscriptionService = {
      getSubscription: vi.fn().mockReturnValue(of(subscription)),
      archiveSubscription: vi.fn(),
      restoreSubscription: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SubscriptionDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => subscription.id } } },
        },
        { provide: SubscriptionService, useValue: subscriptionService },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(SubscriptionDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads the requested subscription on creation', () => {
    createComponent();

    expect(subscriptionService.getSubscription).toHaveBeenCalledWith(subscription.id);
    expect(component.subscription()).toEqual(subscription);
    expect(component.isLoading()).toBe(false);
  });

  it('marks a missing subscription as not found', () => {
    subscriptionService.getSubscription.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );

    createComponent();

    expect(component.notFound()).toBe(true);
    expect(component.loadError()).toBeNull();
  });

  it('replaces the active subscription with the archived API response', () => {
    const archivedSubscription: SubscriptionDetail = {
      ...subscription,
      status: 'Archived',
      archivedAt: '2026-08-29T13:00:00Z',
      updatedAt: '2026-08-29T13:00:00Z',
    };
    subscriptionService.archiveSubscription.mockReturnValue(of(archivedSubscription));
    createComponent();
    component.showArchiveConfirmation.set(true);

    component.archiveSubscription();

    expect(subscriptionService.archiveSubscription).toHaveBeenCalledWith(subscription.id);
    expect(component.subscription()).toEqual(archivedSubscription);
    expect(component.showArchiveConfirmation()).toBe(false);
    expect(component.successMessage()).toContain('gearchiveerd');
    expect(component.isChangingArchiveStatus()).toBe(false);
  });

  it('restores an archived subscription using the API response', () => {
    const archivedSubscription: SubscriptionDetail = {
      ...subscription,
      status: 'Archived',
      archivedAt: '2026-08-29T13:00:00Z',
    };
    subscriptionService.restoreSubscription.mockReturnValue(of(subscription));
    createComponent();
    component.subscription.set(archivedSubscription);

    component.restoreSubscription();

    expect(subscriptionService.restoreSubscription).toHaveBeenCalledWith(subscription.id);
    expect(component.subscription()).toEqual(subscription);
    expect(component.successMessage()).toContain('hersteld');
    expect(component.isChangingArchiveStatus()).toBe(false);
  });

  it('uses readable labels for billing frequency and cancellation period', () => {
    createComponent();

    expect(component.billingFrequencyLabel('SemiAnnually')).toBe('Halfjaarlijks');
    expect(component.cancellationNoticeLabel(null)).toBe('Niet ingevuld');
    expect(component.cancellationNoticeLabel(1)).toBe('1 dag');
    expect(component.cancellationNoticeLabel(30)).toBe('30 dagen');
  });
});
