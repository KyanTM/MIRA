import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { SubscriptionService } from '../data-access/subscription.service';
import { SubscriptionDetail, UpdateSubscriptionRequest } from '../models';
import { SubscriptionForm } from '../subscription-form/subscription-form';

@Component({
  selector: 'app-subscription-edit',
  imports: [ErrorState, PageHeader, RouterLink, SubscriptionForm],
  templateUrl: './subscription-edit.html',
  styleUrl: './subscription-edit.css',
})
export class SubscriptionEdit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptionId = this.route.snapshot.paramMap.get('id') ?? '';
  private changesSaved = false;

  readonly subscription = signal<SubscriptionDetail | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly notFound = signal(false);
  readonly serverError = signal<string | null>(null);

  constructor() {
    this.loadSubscription();
  }

  loadSubscription(): void {
    if (!this.subscriptionId) {
      this.isLoading.set(false);
      this.notFound.set(true);
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

  updateSubscription(request: UpdateSubscriptionRequest): void {
    if (this.isSubmitting() || this.changesSaved) {
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    this.subscriptionService
      .updateSubscription(this.subscriptionId, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (subscription) => {
          this.changesSaved = true;
          void this.router.navigate(['/subscriptions', subscription.id], {
            state: { message: 'Wijzigingen opgeslagen.' },
          });
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.serverError.set(
              'Dit abonnement bestaat niet meer of je hebt er geen toegang toe.',
            );
            return;
          }

          if (error.status === 400) {
            this.serverError.set(
              'Controleer de ingevulde gegevens. Sommige waarden zijn niet geldig.',
            );
            return;
          }

          if (error.status === 0) {
            this.serverError.set(
              'De server is niet bereikbaar. Je wijzigingen zijn niet opgeslagen.',
            );
            return;
          }

          this.serverError.set(
            'Je wijzigingen konden niet worden opgeslagen. Probeer het opnieuw.',
          );
        },
      });
  }

  private getLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'De server is momenteel niet bereikbaar. Controleer of de backend draait.';
    }

    return 'Het abonnement kon niet worden geladen. Probeer het opnieuw.';
  }
}
