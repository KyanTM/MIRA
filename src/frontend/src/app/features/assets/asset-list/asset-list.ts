import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons';
import { finalize, Subscription } from 'rxjs';

import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { AssetService } from '../data-access/asset.service';
import { AssetSummary } from '../models';

@Component({
  selector: 'app-asset-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    EmptyState,
    ErrorState,
    FontAwesomeModule,
    PageHeader,
    RouterLink,
    StatusBadge,
  ],
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.css',
})
export class AssetList {
  private readonly assetService = inject(AssetService);
  private readonly destroyRef = inject(DestroyRef);
  private assetsRequest: Subscription | null = null;

  readonly searchIcon = faMagnifyingGlass;
  readonly addIcon = faPlus;
  readonly assets = signal<AssetSummary[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly includeArchived = signal(false);

  readonly filteredAssets = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase('nl-BE');

    if (query.length === 0) {
      return this.assets();
    }

    return this.assets().filter((asset) => {
      const searchableValues = [asset.name, asset.brand, asset.model, asset.serialNumber];

      return searchableValues.some((value) => value?.toLocaleLowerCase('nl-BE').includes(query));
    });
  });

  constructor() {
    this.loadAssets();
  }

  loadAssets(): void {
    this.assetsRequest?.unsubscribe();
    this.isLoading.set(true);
    this.loadError.set(null);

    this.assetsRequest = this.assetService
      .getAssets(this.includeArchived())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (assets) => this.assets.set(assets),
        error: (error: HttpErrorResponse) => {
          this.assets.set([]);
          this.loadError.set(this.getLoadErrorMessage(error));
        },
      });
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setIncludeArchived(value: boolean): void {
    this.includeArchived.set(value);
    this.loadAssets();
  }

  private getLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'De server is momenteel niet bereikbaar. Controleer of de backend draait.';
    }

    return 'Je bezittingen konden niet worden geladen. Probeer het straks opnieuw.';
  }
}
