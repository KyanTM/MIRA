import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons';
import { finalize, Subscription as RxSubscription } from 'rxjs';

import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { DateOnlyPipe } from '../../../shared/date-only.pipe';
import { SubscriptionService } from '../data-access/subscription.service';
import { BillingFrequency, SubscriptionSummary } from '../models';

const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  Weekly: 'Per week',
  Monthly: 'Per maand',
  Quarterly: 'Per kwartaal',
  SemiAnnually: 'Per halfjaar',
  Yearly: 'Per jaar',
};

@Component({
  selector: 'app-subscription-list',
  imports: [
    CurrencyPipe,
    DateOnlyPipe,
    EmptyState,
    ErrorState,
    FontAwesomeModule,
    PageHeader,
    RouterLink,
    StatusBadge,
  ],
  templateUrl: './subscription-list.html',
  styleUrl: './subscription-list.css',
})
export class SubscriptionList {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly destroyRef = inject(DestroyRef);
  private subscriptionsRequest: RxSubscription | null = null;

  readonly searchIcon = faMagnifyingGlass;
  readonly addIcon = faPlus;
  readonly subscriptions = signal<SubscriptionSummary[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly includeArchived = signal(false);

  readonly filteredSubscriptions = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase('nl-BE');

    if (query.length === 0) {
      return this.subscriptions();
    }

    return this.subscriptions().filter((subscription) =>
      [subscription.name, subscription.provider].some((value) =>
        value.toLocaleLowerCase('nl-BE').includes(query),
      ),
    );
  });

  constructor() {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.subscriptionsRequest?.unsubscribe();
    this.isLoading.set(true);
    this.loadError.set(null);

    this.subscriptionsRequest = this.subscriptionService
      .getSubscriptions(this.includeArchived())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (subscriptions) => this.subscriptions.set(subscriptions),
        error: (error: HttpErrorResponse) => {
          this.subscriptions.set([]);
          this.loadError.set(this.getLoadErrorMessage(error));
        },
      });
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setIncludeArchived(value: boolean): void {
    this.includeArchived.set(value);
    this.loadSubscriptions();
  }

  billingFrequencyLabel(frequency: BillingFrequency): string {
    return BILLING_FREQUENCY_LABELS[frequency];
  }

  displayStatus(subscription: Pick<SubscriptionSummary, 'isActive' | 'status'>): string {
    if (subscription.status !== 'Active') {
      return subscription.status;
    }

    return subscription.isActive ? 'Active' : 'Inactive';
  }

  private getLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'De server is momenteel niet bereikbaar. Controleer of de backend draait.';
    }

    return 'Je abonnementen konden niet worden geladen. Probeer het straks opnieuw.';
  }
}
