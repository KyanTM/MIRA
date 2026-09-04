import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardCounts } from '../models';

interface SummaryMetric {
  label: string;
  value: number;
  link: string | null;
}

@Component({
  selector: 'app-dashboard-summary',
  imports: [RouterLink],
  templateUrl: './dashboard-summary.html',
  styleUrl: './dashboard-summary.css',
})
export class DashboardSummary {
  readonly counts = input.required<DashboardCounts>();

  readonly metrics = computed<SummaryMetric[]>(() => {
    const counts = this.counts();

    return [
      { label: 'Bezittingen', value: counts.assets, link: '/assets' },
      { label: 'Documenten', value: counts.documents, link: null },
      { label: 'Garanties', value: counts.warranties, link: null },
      { label: 'Contracten', value: counts.contracts, link: null },
      { label: 'Abonnementen', value: counts.subscriptions, link: '/subscriptions' },
    ];
  });
}
