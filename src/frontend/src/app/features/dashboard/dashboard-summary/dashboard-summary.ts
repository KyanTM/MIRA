import { Component, computed, input } from '@angular/core';

import { DashboardCounts } from '../models';

interface SummaryMetric {
  label: string;
  value: number;
}

@Component({
  selector: 'app-dashboard-summary',
  templateUrl: './dashboard-summary.html',
  styleUrl: './dashboard-summary.css',
})
export class DashboardSummary {
  readonly counts = input.required<DashboardCounts>();

  readonly metrics = computed<SummaryMetric[]>(() => {
    const counts = this.counts();

    return [
      { label: 'Bezittingen', value: counts.assets },
      { label: 'Documenten', value: counts.documents },
      { label: 'Garanties', value: counts.warranties },
      { label: 'Contracten', value: counts.contracts },
      { label: 'Abonnementen', value: counts.subscriptions },
    ];
  });
}
