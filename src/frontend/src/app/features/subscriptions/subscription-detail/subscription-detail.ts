import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBoxArchive, faPen, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';

import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { DateOnlyPipe } from '../../../shared/date-only.pipe';
import { SubscriptionService } from '../data-access/subscription.service';
import { BillingFrequency, SubscriptionDetail } from '../models';

const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  Weekly: 'Wekelijks',
  Monthly: 'Maandelijks',
  Quarterly: 'Per kwartaal',
  SemiAnnually: 'Halfjaarlijks',
  Yearly: 'Jaarlijks',
};

@Component({
  selector: 'app-subscription-detail',
  imports: [
    CurrencyPipe,
    DateOnlyPipe,
    DatePipe,
    ErrorState,
    FontAwesomeModule,
    PageHeader,
    RouterLink,
    StatusBadge,
  ],
  templateUrl: './subscription-detail.html',
  styleUrl: './subscription-detail.css',
})
export class SubscriptionDetailPage {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly subscriptionId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly editIcon = faPen;
  readonly archiveIcon = faBoxArchive;
  readonly restoreIcon = faRotateLeft;
  readonly subscription = signal<SubscriptionDetail | null>(null);
  readonly isLoading = signal(true);
  readonly isChangingArchiveStatus = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(this.readNavigationMessage());
  readonly notFound = signal(false);
  readonly showArchiveConfirmation = signal(false);
  readonly archiveTrigger = viewChild<ElementRef<HTMLButtonElement>>('archiveTrigger');
  readonly successNotice = viewChild<ElementRef<HTMLParagraphElement>>('successNotice');

  constructor() {
    this.loadSubscription();
  }

  loadSubscription(): void {
    if (!this.subscriptionId) {
      this.subscription.set(null);
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);
    this.notFound.set(false);

    this.subscriptionService
      .getSubscription(this.subscriptionId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (subscription) => this.subscription.set(subscription),
        error: (error: HttpErrorResponse) => {
          this.subscription.set(null);

          if (error.status === 404) {
            this.notFound.set(true);
            return;
          }

          this.loadError.set(this.getLoadErrorMessage(error));
        },
      });
  }

  archiveSubscription(): void {
    if (this.isChangingArchiveStatus()) {
      return;
    }

    this.isChangingArchiveStatus.set(true);
    this.actionError.set(null);
    this.successMessage.set(null);

    this.subscriptionService
      .archiveSubscription(this.subscriptionId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isChangingArchiveStatus.set(false)),
      )
      .subscribe({
        next: (subscription) => {
          this.subscription.set(subscription);
          this.showArchiveConfirmation.set(false);
          this.successMessage.set('Abonnement gearchiveerd. Je kunt het later altijd herstellen.');
          this.focusSuccessNotice();
        },
        error: (error: HttpErrorResponse) => {
          this.actionError.set(this.getActionErrorMessage(error, 'archive'));
        },
      });
  }

  restoreSubscription(): void {
    if (this.isChangingArchiveStatus()) {
      return;
    }

    this.isChangingArchiveStatus.set(true);
    this.actionError.set(null);
    this.successMessage.set(null);

    this.subscriptionService
      .restoreSubscription(this.subscriptionId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isChangingArchiveStatus.set(false)),
      )
      .subscribe({
        next: (subscription) => {
          this.subscription.set(subscription);
          this.successMessage.set(
            'Abonnement hersteld en opnieuw zichtbaar in je actieve overzicht.',
          );
          this.focusSuccessNotice();
        },
        error: (error: HttpErrorResponse) => {
          this.actionError.set(this.getActionErrorMessage(error, 'restore'));
        },
      });
  }

  closeArchiveConfirmation(): void {
    this.showArchiveConfirmation.set(false);
    this.archiveTrigger()?.nativeElement.focus();
  }

  billingFrequencyLabel(frequency: BillingFrequency): string {
    return BILLING_FREQUENCY_LABELS[frequency];
  }

  displayStatus(subscription: Pick<SubscriptionDetail, 'isActive' | 'status'>): string {
    if (subscription.status !== 'Active') {
      return subscription.status;
    }

    return subscription.isActive ? 'Active' : 'Inactive';
  }

  cancellationNoticeLabel(days: number | null): string {
    if (days === null) {
      return 'Niet ingevuld';
    }

    if (days === 0) {
      return 'Geen opzegtermijn';
    }

    return `${days} ${days === 1 ? 'dag' : 'dagen'}`;
  }

  private getLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'De server is momenteel niet bereikbaar. Controleer of de backend draait.';
    }

    return 'Het abonnement kon niet worden geladen. Probeer het opnieuw.';
  }

  private getActionErrorMessage(error: HttpErrorResponse, action: 'archive' | 'restore'): string {
    const infinitive = action === 'archive' ? 'archiveren' : 'herstellen';
    const participle = action === 'archive' ? 'gearchiveerd' : 'hersteld';

    if (error.status === 404) {
      return `Dit abonnement bestaat niet meer of je hebt geen toegang om het te ${infinitive}.`;
    }

    if (error.status === 0) {
      return `De server is niet bereikbaar. Het abonnement kon niet worden ${participle}.`;
    }

    return `Het abonnement kon niet worden ${participle}. Probeer het opnieuw.`;
  }

  private focusSuccessNotice(): void {
    setTimeout(() => this.successNotice()?.nativeElement.focus());
  }

  private readNavigationMessage(): string | null {
    const message = this.router.getCurrentNavigation()?.extras.state?.['message'];
    return typeof message === 'string' ? message : null;
  }
}
