import { Component, signal } from '@angular/core';

import { CreateSubscriptionRequest } from '../models';
import { SubscriptionForm } from '../subscription-form/subscription-form';

@Component({
  selector: 'app-subscription-create',
  imports: [SubscriptionForm],
  templateUrl: './subscription-create.html',
  styleUrl: './subscription-create.css',
})
export class SubscriptionCreate {
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);

  createSubscription(_request: CreateSubscriptionRequest): void {
    // ===== JOUW CODE — leerstap 6 =====
    // Injecteer SubscriptionService en Router.
    // Verstuur request, blokkeer dubbel klikken en navigeer bij succes
    // naar de detailpagina van de aangemaakte subscription.
    // ===== EINDE JOUW CODE =====
  }
}
