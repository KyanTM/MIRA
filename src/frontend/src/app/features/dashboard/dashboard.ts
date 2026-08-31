import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ErrorState } from '../../shared/ui/error-state/error-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { AttentionList } from './attention-list/attention-list';
import { DashboardSummary } from './dashboard-summary/dashboard-summary';
import { DashboardService } from './dashboard.service';
import { DashboardResponse } from './models';
import { RecentItems } from './recent-items/recent-items';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, PageHeader, ErrorState, DashboardSummary, AttentionList, RecentItems],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dashboard = signal<DashboardResponse | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isEmptyArchive = computed(() => {
    const counts = this.dashboard()?.counts;

    return (
      counts !== undefined &&
      counts.assets === 0 &&
      counts.documents === 0 &&
      counts.warranties === 0 &&
      counts.contracts === 0 &&
      counts.subscriptions === 0
    );
  });

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.dashboardService
      .getDashboard()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (dashboard) => this.dashboard.set(dashboard),
        error: () => {
          this.dashboard.set(null);
          this.loadError.set('Controleer je verbinding en probeer het opnieuw.');
        },
      });
  }
}
