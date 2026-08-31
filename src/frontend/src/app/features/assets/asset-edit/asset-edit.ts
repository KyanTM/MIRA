import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';

import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { AssetForm } from '../asset-form/asset-form';
import { imageUploadError } from '../asset-image-errors';
import { AssetImageService } from '../data-access/asset-image.service';
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
  private readonly assetImageService = inject(AssetImageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly assetId = this.route.snapshot.paramMap.get('id') ?? '';
  private changesSaved = false;

  readonly asset = signal<AssetDetail | null>(null);
  readonly selectedImage = signal<File | null>(null);
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
    if (this.isSubmitting() || this.changesSaved) {
      return;
    }

    const image = this.selectedImage();
    this.isSubmitting.set(true);
    this.serverError.set(null);

    this.assetService
      .updateAsset(this.assetId, request)
      .pipe(
        switchMap((asset) => {
          // Prevent a second image upload while navigation to the saved asset is pending.
          this.changesSaved = true;

          if (image === null) {
            return of({ asset, warning: null });
          }

          return this.assetImageService.addImage(asset.id, image).pipe(
            map(() => ({ asset, warning: null })),
            catchError((error: unknown) =>
              of({
                asset,
                warning: `Je wijzigingen zijn opgeslagen. ${imageUploadError(error)} Voeg de afbeelding hieronder opnieuw toe.`,
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
              ? { message: 'Wijzigingen opgeslagen.', warning }
              : { message: 'Wijzigingen opgeslagen.' },
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
