import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { AssetForm } from '../asset-form/asset-form';
import { AssetService } from '../data-access/asset.service';
import { AssetDetail, UpdateAssetRequest } from '../models';

@Component({
  selector: 'app-asset-edit',
  imports: [AssetForm, ErrorState, PageHeader, RouterLink],
  templateUrl: './asset-edit.html',
  styleUrl: './asset-edit.css',
})
export class AssetEdit {
  private readonly assetService = inject(AssetService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly assetId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly asset = signal<AssetDetail | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly notFound = signal(false);
  readonly serverError = signal<string | null>(null);

  constructor() {
    this.loadAsset();
  }

  loadAsset(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.notFound.set(false);

    this.assetService
      .getAsset(this.assetId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (asset) => this.asset.set(asset),
        error: (error: HttpErrorResponse) => {
          this.asset.set(null);

          if (error.status === 404) {
            this.notFound.set(true);
            return;
          }

          this.loadError.set(this.getLoadErrorMessage(error));
        },
      });
  }

  updateAsset(request: UpdateAssetRequest): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    this.assetService
      .updateAsset(this.assetId, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (asset) => {
          void this.router.navigate(['/assets', asset.id], {
            state: { message: 'Wijzigingen opgeslagen.' },
          });
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.serverError.set(
              'Deze bezitting bestaat niet meer of je hebt er geen toegang toe.',
            );
            return;
          }

          if (error.status === 400) {
            this.serverError.set(
              'Controleer de ingevulde gegevens. Sommige waarden zijn niet geldig.',
            );
            return;
          }

          if (error.status === 0) {
            this.serverError.set(
              'De server is niet bereikbaar. Je wijzigingen zijn niet opgeslagen.',
            );
            return;
          }

          this.serverError.set(
            'Je wijzigingen konden niet worden opgeslagen. Probeer het opnieuw.',
          );
        },
      });
  }

  private getLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'De server is momenteel niet bereikbaar. Controleer of de backend draait.';
    }

    return 'De bezitting kon niet worden geladen. Probeer het opnieuw.';
  }
}
