import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { SubscriptionService } from '../data-access/subscription.service';
import { CreateSubscriptionRequest } from '../models';
import { SubscriptionForm } from '../subscription-form/subscription-form';

@Component({
  selector: 'app-subscription-create',
  imports: [PageHeader, SubscriptionForm],
  templateUrl: './subscription-create.html',
  styleUrl: './subscription-create.css',
})
export class SubscriptionCreate {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private createdSubscriptionId: string | null = null;

  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);

  createSubscription(request: CreateSubscriptionRequest): void {
    if (this.isSubmitting() || this.createdSubscriptionId !== null) {
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    this.subscriptionService
      .createSubscription(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (subscription) => {
          this.createdSubscriptionId = subscription.id;
          void this.router.navigate(['/subscriptions', subscription.id], {
            state: { message: 'Abonnement toegevoegd.' },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.serverError.set(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'De server is momenteel niet bereikbaar. Je gegevens zijn niet opgeslagen.';
    }

    if (error.status === 400) {
      return 'Controleer de ingevulde gegevens. Sommige waarden zijn niet geldig.';
    }

    return 'Het abonnement kon niet worden toegevoegd. Probeer het opnieuw.';
  }
}
