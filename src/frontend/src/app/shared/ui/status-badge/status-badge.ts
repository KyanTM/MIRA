import { Component, computed, input } from '@angular/core';

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Concept',
  Active: 'Actief',
  Inactive: 'Inactief',
  Expired: 'Verlopen',
  Completed: 'Voltooid',
  Cancelled: 'Geannuleerd',
  Archived: 'Gearchiveerd',
};

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  readonly status = input.required<string>();

  readonly label = computed(() => STATUS_LABELS[this.status()] ?? this.status());

  readonly tone = computed(() => {
    switch (this.status()) {
      case 'Active':
      case 'Completed':
        return 'success';
      case 'Expired':
      case 'Cancelled':
        return 'danger';
      case 'Draft':
        return 'info';
      default:
        return 'neutral';
    }
  });
}
