import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { AssetForm } from '../asset-form/asset-form';
import { AssetService } from '../data-access/asset.service';
import { CreateAssetRequest } from '../models';

@Component({
  selector: 'app-asset-create',
  imports: [AssetForm, PageHeader],
  templateUrl: './asset-create.html',
  styleUrl: './asset-create.css',
})
export class AssetCreate {
  private readonly assetService = inject(AssetService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);

  createAsset(request: CreateAssetRequest): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    this.assetService
      .createAsset(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (asset) => {
          void this.router.navigate(['/assets', asset.id], {
            state: { message: 'Bezitting toegevoegd.' },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.serverError.set(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'De server is momenteel niet bereikbaar. Je gegevens zijn niet opgeslagen.';
    }

    if (error.status === 400) {
      return 'Controleer de ingevulde gegevens. Sommige waarden zijn niet geldig.';
    }

    return 'De bezitting kon niet worden toegevoegd. Probeer het opnieuw.';
  }
}
