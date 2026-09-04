import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SubscriptionDetail } from '../models';

@Component({
  selector: 'app-subscription-detail',
  templateUrl: './subscription-detail.html',
  styleUrl: './subscription-detail.css',
})
export class SubscriptionDetailPage {
  private readonly route = inject(ActivatedRoute);

  readonly subscriptionId = this.route.snapshot.paramMap.get('id');
  readonly subscription = signal<SubscriptionDetail | null>(null);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);

  loadSubscription(): void {
    // ===== JOUW CODE — leerstap 4A =====
    // Controleer eerst of subscriptionId bestaat.
    // Injecteer daarna de service en vraag één subscription op.
    // Vul de drie signals hierboven in bij succes of fout.
    // ===== EINDE JOUW CODE =====
  }
}
