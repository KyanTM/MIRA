import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CreateSubscriptionRequest, SubscriptionDetail } from '../models';
import { SubscriptionForm } from '../subscription-form/subscription-form';

@Component({
  selector: 'app-subscription-edit',
  imports: [SubscriptionForm],
  templateUrl: './subscription-edit.html',
  styleUrl: './subscription-edit.css',
})
export class SubscriptionEdit {
  private readonly route = inject(ActivatedRoute);

  readonly subscriptionId = this.route.snapshot.paramMap.get('id');
  readonly subscription = signal<SubscriptionDetail | null>(null);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);

  loadSubscription(): void {
    // ===== JOUW CODE — leerstap 7A =====
    // Haal de bestaande data op zoals bij de detailpagina.
    // ===== EINDE JOUW CODE =====
  }

  updateSubscription(_request: CreateSubscriptionRequest): void {
    // ===== JOUW CODE — leerstap 7B =====
    // Verstuur de aangepaste data en navigeer bij succes terug naar detail.
    // ===== EINDE JOUW CODE =====
  }
}
