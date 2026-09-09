import { ItemRelations } from '../../records/item-relations';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBoxArchive, faPen, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs';

import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { DateOnlyPipe } from '../../../shared/date-only.pipe';
import { AssetImages } from '../asset-images/asset-images';
import { AssetService } from '../data-access/asset.service';
import { AssetDetail as AssetDetailModel } from '../models';

@Component({
  selector: 'app-asset-detail',
  imports: [
    ItemRelations,
    AssetImages,
    CurrencyPipe,
    DateOnlyPipe,
    DatePipe,
    ErrorState,
    FontAwesomeModule,
    PageHeader,
    RouterLink,
    StatusBadge,
  ],
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.css',
})
export class AssetDetailPage {
  private readonly assetService = inject(AssetService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly assetId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly editIcon = faPen;
  readonly archiveIcon = faBoxArchive;
  readonly restoreIcon = faRotateLeft;
  readonly asset = signal<AssetDetailModel | null>(null);
  readonly isLoading = signal(true);
  readonly isChangingArchiveStatus = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(this.readNavigationMessage('message'));
  readonly uploadWarning = signal<string | null>(this.readNavigationMessage('warning'));
  readonly notFound = signal(false);
  readonly showArchiveConfirmation = signal(false);
  readonly archiveTrigger = viewChild<ElementRef<HTMLButtonElement>>('archiveTrigger');
  readonly successNotice = viewChild<ElementRef<HTMLParagraphElement>>('successNotice');

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

  archiveAsset(): void {
    if (this.isChangingArchiveStatus()) {
      return;
    }

    this.isChangingArchiveStatus.set(true);
    this.actionError.set(null);
    this.successMessage.set(null);

    this.assetService
      .archiveAsset(this.assetId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isChangingArchiveStatus.set(false)),
      )
      .subscribe({
        next: (asset) => {
          this.asset.set(asset);
          this.showArchiveConfirmation.set(false);
          this.successMessage.set('Bezitting gearchiveerd. Je kunt ze later altijd herstellen.');
          this.focusSuccessNotice();
        },
        error: (error: HttpErrorResponse) => {
          this.actionError.set(this.getActionErrorMessage(error, 'archive'));
        },
      });
  }

  restoreAsset(): void {
    if (this.isChangingArchiveStatus()) {
      return;
    }

    this.isChangingArchiveStatus.set(true);
    this.actionError.set(null);
    this.successMessage.set(null);

    this.assetService
      .restoreAsset(this.assetId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isChangingArchiveStatus.set(false)),
      )
      .subscribe({
        next: (asset) => {
          this.asset.set(asset);
          this.successMessage.set('Bezitting hersteld en opnieuw actief.');
          this.focusSuccessNotice();
        },
        error: (error: HttpErrorResponse) => {
          this.actionError.set(this.getActionErrorMessage(error, 'restore'));
        },
      });
  }

  private getLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'De server is momenteel niet bereikbaar. Controleer of de backend draait.';
    }

    return 'De bezitting kon niet worden geladen. Probeer het opnieuw.';
  }

  closeArchiveConfirmation(): void {
    this.showArchiveConfirmation.set(false);
    this.archiveTrigger()?.nativeElement.focus();
  }

  private focusSuccessNotice(): void {
    setTimeout(() => this.successNotice()?.nativeElement.focus());
  }

  private readNavigationMessage(key: 'message' | 'warning'): string | null {
    const message = this.router.getCurrentNavigation()?.extras.state?.[key];
    return typeof message === 'string' ? message : null;
  }

  private getActionErrorMessage(error: HttpErrorResponse, action: 'archive' | 'restore'): string {
    const infinitive = action === 'archive' ? 'archiveren' : 'herstellen';
    const participle = action === 'archive' ? 'gearchiveerd' : 'hersteld';

    if (error.status === 404) {
      return `Deze bezitting bestaat niet meer of je hebt geen toegang om ze te ${infinitive}.`;
    }

    if (error.status === 0) {
      return `De server is niet bereikbaar. De bezitting kon niet worden ${participle}.`;
    }

    return `De bezitting kon niet worden ${participle}. Probeer het opnieuw.`;
  }
}
