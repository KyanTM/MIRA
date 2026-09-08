import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';

import { DashboardAttentionItem, DashboardEventType } from '../models';

const EVENT_LABELS: Record<DashboardEventType, string> = {
  WarrantyExpires: 'Garantie verloopt',
  DocumentExpires: 'Document verloopt',
  ContractCancellationDeadline: 'Opzegtermijn eindigt',
  ContractEnds: 'Contract eindigt',
  SubscriptionBilling: 'Volgende betaling',
};

@Component({
  selector: 'app-attention-list',
  imports: [FontAwesomeModule, RouterLink],
  templateUrl: './attention-list.html',
  styleUrl: './attention-list.css',
})
export class AttentionList {
  readonly items = input.required<DashboardAttentionItem[]>();
  readonly generatedAt = input.required<string>();
  readonly attentionThrough = input.required<string>();
  readonly emptyIcon = faCalendarCheck;

  eventLabel(eventType: DashboardEventType): string {
    return EVENT_LABELS[eventType];
  }

  formatDate(dateOnly: string): string {
    return new Intl.DateTimeFormat('nl-BE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(this.parseDateOnly(dateOnly));
  }

  relativeDate(dateOnly: string): string {
    const days = this.daysFromGeneratedDate(dateOnly);

    if (days === 0) {
      return 'Vandaag';
    }

    if (days === 1) {
      return 'Morgen';
    }

    if (days === -1) {
      return '1 dag te laat';
    }

    if (days < 0) {
      return `${Math.abs(days)} dagen te laat`;
    }

    return `Over ${days} dagen`;
  }

  dateTone(dateOnly: string): 'overdue' | 'soon' | 'later' {
    const days = this.daysFromGeneratedDate(dateOnly);

    if (days < 0) {
      return 'overdue';
    }

    return days <= 7 ? 'soon' : 'later';
  }

  private daysFromGeneratedDate(dateOnly: string): number {
    const dueDate = this.parseDateOnly(dateOnly);
    const generatedDate = this.parseDateOnly(this.generatedAt().slice(0, 10));
    return Math.round((dueDate.getTime() - generatedDate.getTime()) / 86_400_000);
  }

  private parseDateOnly(dateOnly: string): Date {
    return new Date(`${dateOnly}T00:00:00Z`);
  }
}
