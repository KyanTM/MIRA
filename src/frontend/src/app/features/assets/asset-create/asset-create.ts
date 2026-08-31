import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';

import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { AssetForm } from '../asset-form/asset-form';
import { imageUploadError } from '../asset-image-errors';
import { AssetImageService } from '../data-access/asset-image.service';
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
  private readonly assetImageService = inject(AssetImageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private savedAssetId: string | null = null;

  readonly selectedImage = signal<File | null>(null);
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);

  createAsset(request: CreateAssetRequest): void {
    if (this.isSubmitting() || this.savedAssetId !== null) {
      return;
    }

    const image = this.selectedImage();
    this.isSubmitting.set(true);
    this.serverError.set(null);

    this.assetService
      .createAsset(request)
      .pipe(
        switchMap((asset) => {
          // The asset already exists, even if its optional image upload fails.
          this.savedAssetId = asset.id;

          if (image === null) {
            return of({ asset, warning: null });
          }

          return this.assetImageService.uploadImage(asset.id, image, 'PrimaryImage').pipe(
            map(() => ({ asset, warning: null })),
            catchError((error: unknown) =>
              of({
                asset,
                warning: `De bezitting is opgeslagen. ${imageUploadError(error)} Voeg de afbeelding hieronder opnieuw toe.`,
              }),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: ({ asset, warning }) => {
          void this.router.navigate(['/assets', asset.id], {
            state: warning
              ? { message: 'Bezitting toegevoegd.', warning }
              : { message: 'Bezitting toegevoegd.' },
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
