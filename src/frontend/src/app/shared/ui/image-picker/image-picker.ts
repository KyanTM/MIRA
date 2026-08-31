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

export interface ImageSelection {
  file: File | null;
  error: string | null;
}

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.html',
  styleUrl: './image-picker.css',
})
export class ImagePicker {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private objectUrl: string | null = null;

  readonly inputId = input('asset-image');
  readonly label = input('Afbeelding (optioneel)');
  readonly disabled = input(false);
  readonly resetToken = input(0);
  readonly selectionChanged = output<ImageSelection>();

  readonly error = signal<string | null>(null);
  readonly preview = signal<{ file: File; url: string } | null>(null);
  readonly previews = computed(() => {
    const preview = this.preview();
    return preview === null ? [] : [preview];
  });

  constructor() {
    effect(() => {
      this.resetToken();

      untracked(() => {
        if (this.preview() !== null || this.error() !== null) {
          this.resetSelection();
          this.selectionChanged.emit({ file: null, error: null });
        }
      });
    });

    this.destroyRef.onDestroy(() => this.releasePreview());
  }

  onFileChange(event: Event): void {
    if (this.disabled()) {
      return;
    }

    const file = (event.target as HTMLInputElement).files?.[0];
    if (file === undefined) {
      return;
    }

    this.releasePreview();
    const error = this.validateFile(file);
    this.error.set(error);

    if (error !== null) {
      this.resetInput();
      this.selectionChanged.emit({ file: null, error });
      return;
    }

    try {
      this.objectUrl = URL.createObjectURL(file);
      this.preview.set({ file, url: this.objectUrl });
      this.selectionChanged.emit({ file, error: null });
    } catch {
      const previewError = 'Het voorbeeld kon niet worden gemaakt. Kies de afbeelding opnieuw.';
      this.resetSelection();
      this.error.set(previewError);
      this.selectionChanged.emit({ file: null, error: previewError });
    }
  }

  clearSelection(): void {
    if (this.disabled()) {
      return;
    }

    this.resetSelection();
    this.selectionChanged.emit({ file: null, error: null });
    this.fileInput()?.nativeElement.focus();
  }

  onPreviewError(url: string): void {
    if (this.objectUrl !== url) {
      return;
    }

    const error =
      'Deze afbeelding kan niet worden geopend. Kies een ander JPG-, PNG- of WebP-bestand.';
    this.resetSelection();
    this.error.set(error);
    this.selectionChanged.emit({ file: null, error });
  }

  formatFileSize(size: number): string {
    if (size < 1024 * 1024) {
      return `${Math.max(1, Math.ceil(size / 1024))} kB`;
    }

    return `${new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 1 }).format(size / (1024 * 1024))} MB`;
  }

  private validateFile(file: File): string | null {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const expectedType = IMAGE_TYPES[extension];

    if (
      expectedType === undefined ||
      (file.type !== '' && file.type.toLowerCase() !== expectedType)
    ) {
      return 'Kies een JPG-, PNG- of WebP-afbeelding waarvan het bestandstype bij de extensie past.';
    }

    if (file.size === 0) {
      return 'Dit bestand is leeg. Kies een andere afbeelding.';
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return 'Deze afbeelding is te groot. Kies een bestand van maximaal 20 MB.';
    }

    return null;
  }

  private resetSelection(): void {
    this.releasePreview();
    this.error.set(null);
    this.resetInput();
  }

  private resetInput(): void {
    const input = this.fileInput()?.nativeElement;
    if (input !== undefined) {
      input.value = '';
    }
  }

  private releasePreview(): void {
    if (this.objectUrl !== null) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }

    this.preview.set(null);
  }
}
