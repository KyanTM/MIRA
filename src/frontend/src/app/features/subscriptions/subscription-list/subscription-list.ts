import { Component, computed, signal } from '@angular/core';

import { SubscriptionSummary } from '../models';

@Component({
  selector: 'app-subscription-list',
  templateUrl: './subscription-list.html',
  styleUrl: './subscription-list.css',
})
export class SubscriptionList {
  readonly subscriptions = signal<SubscriptionSummary[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly includeArchived = signal(false);

  readonly filteredSubscriptions = computed(() => {
    // ===== JOUW CODE — leerstap 3B =====
    // Vervang deze tijdelijke return door een filter op naam en provider.
    // Begin met trim() en zet de zoekterm om naar kleine letters.
    // ===== EINDE JOUW CODE =====
    return this.subscriptions();
  });

  loadSubscriptions(): void {
    // ===== JOUW CODE — leerstap 3A =====
    // Injecteer eerst SubscriptionService bovenaan de klasse.
    // Zet loading aan, wis de oude fout en subscribe daarna op de service.
    // Werk next, error en finalize afzonderlijk af.
    // ===== EINDE JOUW CODE =====
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setIncludeArchived(value: boolean): void {
    this.includeArchived.set(value);
    // TODO: laad hierna de lijst opnieuw.
  }
}
