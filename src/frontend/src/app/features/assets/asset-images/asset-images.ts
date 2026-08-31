import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';

import { ImagePicker, ImageSelection } from '../../../shared/ui/image-picker/image-picker';
import { imageUploadError } from '../asset-image-errors';
import { AssetImageService } from '../data-access/asset-image.service';
import { AssetImage } from '../image-models';

@Component({
  selector: 'app-asset-images',
  imports: [ImagePicker],
  templateUrl: './asset-images.html',
  styleUrl: './asset-images.css',
})
export class AssetImages {
  private readonly imageService = inject(AssetImageService);
  private readonly destroyRef = inject(DestroyRef);
  private loadSubscription?: Subscription;
  private previewObjectUrl: string | null = null;

  readonly assetId = input.required<string>();
  readonly assetName = input.required<string>();
  readonly isArchived = input(false);
  readonly imageAdded = output<void>();

  readonly images = signal<AssetImage[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly action = signal<'upload' | 'primary' | 'unlink' | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly selectionError = signal<string | null>(null);
  readonly pickerReset = signal(0);
  readonly confirmUnlink = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal(false);
  readonly previewRetry = signal(0);

  readonly isBusy = computed(() => this.action() !== null);
  readonly primaryImage = computed(
    () => this.images().find((image) => image.role === 'PrimaryImage') ?? null,
  );
  readonly selectedImage = computed(
    () => this.images().find((image) => image.id === this.selectedId()) ?? this.images()[0] ?? null,
  );
  readonly unlinkTrigger = viewChild<ElementRef<HTMLButtonElement>>('unlinkTrigger');
  readonly unlinkConfirmButton = viewChild<ElementRef<HTMLButtonElement>>('unlinkConfirmButton');
  readonly statusNotice = viewChild<ElementRef<HTMLParagraphElement>>('statusNotice');

  constructor() {
    effect(() => {
      this.assetId();
      untracked(() => {
        this.selectedId.set(null);
        this.images.set([]);
        this.selectedFile.set(null);
        this.pickerReset.update((value) => value + 1);
        this.loadImages();
      });
    });

    effect(() => {
      if (this.isArchived()) {
        this.selectedFile.set(null);
        this.selectionError.set(null);
        this.confirmUnlink.set(false);
        untracked(() => this.pickerReset.update((value) => value + 1));
      }
    });

    // Download only the selected image. A gallery does not need every full-size file in memory.
    effect((onCleanup) => {
      const image = this.selectedImage();
      this.previewRetry();
      this.previewError.set(false);
      this.previewLoading.set(image !== null);

      if (image === null) {
        return;
      }

      const subscription = this.imageService.getImageContent(image.id).subscribe({
        next: (blob) => {
          try {
            this.previewObjectUrl = URL.createObjectURL(blob);
            this.previewUrl.set(this.previewObjectUrl);
          } catch {
            this.previewError.set(true);
          }
          this.previewLoading.set(false);
        },
        error: () => {
          this.previewError.set(true);
          this.previewLoading.set(false);
        },
      });

      onCleanup(() => {
        subscription.unsubscribe();
        this.releasePreview();
      });
    });
  }

  loadImages(): void {
    this.loadSubscription?.unsubscribe();
    this.isLoading.set(true);
    this.loadError.set(null);
    this.confirmUnlink.set(false);
    this.selectedFile.set(null);
    this.selectionError.set(null);
    this.pickerReset.update((value) => value + 1);

    this.loadSubscription = this.imageService
      .getImages(this.assetId())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (images) => this.images.set(images),
        error: () => {
          this.loadError.set('De afbeeldingen konden niet worden geladen. Probeer het opnieuw.');
        },
      });
  }

  selectImage(id: string): void {
    if (this.isBusy()) {
      return;
    }

    this.confirmUnlink.set(false);
    this.selectedId.set(id);
  }

  selectFile(selection: ImageSelection): void {
    this.selectedFile.set(selection.file);
    this.selectionError.set(selection.error);

    if (selection.file || selection.error) {
      this.actionError.set(null);
      this.successMessage.set(null);
    }
  }

  uploadImage(): void {
    const file = this.selectedFile();

    if (!file || this.selectionError() || !this.canChangeImages()) {
      return;
    }

    this.startAction('upload');
    this.imageService
      .addImage(this.assetId(), file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.action.set(null)),
      )
      .subscribe({
        next: (image) => {
          this.selectedId.set(image.id);
          this.selectedFile.set(null);
          this.pickerReset.update((value) => value + 1);
          this.showSuccess('Afbeelding toegevoegd.');
          this.imageAdded.emit();
          this.loadImages();
        },
        error: (error: unknown) => this.actionError.set(imageUploadError(error)),
      });
  }

  makePrimary(): void {
    const image = this.selectedImage();
    const primary = this.primaryImage();

    if (
      !image ||
      image.role === 'PrimaryImage' ||
      image.status === 'Archived' ||
      primary?.status === 'Archived' ||
      !this.canChangeImages()
    ) {
      return;
    }

    this.startAction('primary');
    this.imageService
      .makePrimary(this.assetId(), image.id, primary?.id ?? null)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.action.set(null)),
      )
      .subscribe({
        next: () => {
          this.showSuccess('Hoofdafbeelding gewijzigd.');
          this.loadImages();
        },
        error: (error: unknown) => {
          this.actionError.set(this.changeError(error));
          // Switching roles uses two API calls. Reload the actual state, including after a conflict.
          this.loadImages();
        },
      });
  }

  requestUnlink(): void {
    if (!this.canChangeImages()) {
      return;
    }

    this.confirmUnlink.set(true);
    setTimeout(() => this.unlinkConfirmButton()?.nativeElement.focus());
  }

  cancelUnlink(): void {
    this.confirmUnlink.set(false);
    this.unlinkTrigger()?.nativeElement.focus();
  }

  unlinkImage(): void {
    const image = this.selectedImage();

    if (!image || !this.confirmUnlink() || !this.canChangeImages()) {
      return;
    }

    this.startAction('unlink');
    this.imageService
      .unlinkImage(this.assetId(), image.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.action.set(null)),
      )
      .subscribe({
        next: () => {
          this.selectedId.set(null);
          this.confirmUnlink.set(false);
          this.showSuccess('Afbeelding ontkoppeld. Het bestand blijft in je documenten bewaard.');
          this.loadImages();
        },
        error: (error: unknown) => this.actionError.set(this.changeError(error)),
      });
  }

  onPreviewError(url: string): void {
    if (url !== this.previewUrl()) {
      return;
    }

    this.releasePreview();
    this.previewError.set(true);
  }

  retryPreview(): void {
    this.previewRetry.update((value) => value + 1);
  }

  private canChangeImages(): boolean {
    return !this.isArchived() && !this.isBusy() && !this.isLoading() && !this.loadError();
  }

  private startAction(action: 'upload' | 'primary' | 'unlink'): void {
    this.action.set(action);
    this.actionError.set(null);
    this.successMessage.set(null);
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.statusNotice()?.nativeElement.focus());
  }

  private releasePreview(): void {
    if (this.previewObjectUrl !== null) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }

    this.previewUrl.set(null);
  }

  private changeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return 'De bezitting of afbeelding is intussen gewijzigd of gearchiveerd. Controleer de actuele afbeeldingen en probeer opnieuw.';
    }

    return 'De afbeelding kon niet worden bijgewerkt. Probeer het opnieuw.';
  }
}
