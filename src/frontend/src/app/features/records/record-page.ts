import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin, Observable } from 'rxjs';
import { StatusBadge } from '../../shared/ui/status-badge/status-badge';
import { ItemRelations } from './item-relations';
import {
  ArchiveRecord,
  Choice,
  FieldValue,
  itemPath,
  recordConfigs,
  RecordField,
  RecordKind,
} from './record-config';
import { RecordService } from './record.service';

@Component({
  selector: 'app-record-page',
  imports: [ReactiveFormsModule, RouterLink, StatusBadge, ItemRelations],
  templateUrl: './record-page.html',
  styleUrl: './record-page.css',
})
export class RecordPage {
  private readonly sanitizer = inject(DomSanitizer);
  readonly previewUrl = signal<string | null>(null);
  readonly previewResource = signal<SafeResourceUrl | null>(null);
  private readonly api = inject(RecordService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly kind = this.route.snapshot.data['kind'] as RecordKind;
  readonly config = recordConfigs[this.kind];
  readonly mode = this.route.snapshot.data['mode'] as 'list' | 'new' | 'edit' | 'detail';
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly rows = signal<ArchiveRecord[]>([]);
  readonly record = signal<ArchiveRecord | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly search = signal('');
  readonly archived = signal(false);
  readonly typeFilter = signal('');
  readonly choices = signal<Choice[]>([]);
  readonly availableChoices = computed(() =>
    this.choices().filter(
      (choice) => !this.record()?.links?.some((link) => link.itemId === choice.id),
    ),
  );

  readonly assets = signal<Choice[]>([]);
  readonly choiceError = signal(false);
  readonly confirmDelete = signal(false);
  readonly linkControl = new FormControl('', { nonNullable: true });
  readonly form = new FormGroup<Record<string, FormControl<FieldValue>>>({});
  file: File | null = null;
  readonly itemPath = itemPath;
  readonly filtered = computed(() =>
    this.rows().filter(
      (row) =>
        (!this.typeFilter() || row['documentType'] === this.typeFilter()) &&
        [
          row.name,
          row['contractParty'],
          row['provider'],
          row['issuer'],
          row['assetName'],
          row['originalFileName'],
        ].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase('nl')
            .includes(this.search().trim().toLocaleLowerCase('nl')),
        ),
    ),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.closePreview());
    for (const field of this.config.fields) {
      const validators: ValidatorFn[] = [];
      if (field.required)
        validators.push(Validators.required, (control) =>
          typeof control.value === 'string' && !control.value.trim() ? { required: true } : null,
        );
      if (field.max) validators.push(Validators.maxLength(field.max));
      if (field.min !== undefined) validators.push(Validators.min(field.min));
      if (field.integer)
        validators.push(Validators.max(2147483647), (control) =>
          control.value !== null && control.value !== '' && !Number.isInteger(Number(control.value))
            ? { integer: true }
            : null,
        );
      this.form.addControl(
        field.key,
        new FormControl<FieldValue>(
          field.type === 'checkbox'
            ? false
            : field.type === 'number'
              ? null
              : field.key === 'documentType'
                ? 'Other'
                : '',
          validators,
        ),
      );
    }
    this.form.addValidators((control) => {
      const value = control.value;
      const start = value.startsOn || value.issuedOn;
      const end = value.endsOn || value.expiresOn;
      return start && end && end < start ? { dateOrder: true } : null;
    });
    this.form.get('assetId')?.setValue(this.route.snapshot.queryParamMap.get('assetId') ?? '');
    this.linkControl.setValue(this.route.snapshot.queryParamMap.get('itemId') ?? '');
    this.load();
    if (this.mode !== 'list' && (this.kind === 'documents' || this.kind === 'warranties'))
      this.loadChoices();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    const request: Observable<ArchiveRecord | ArchiveRecord[]> | null =
      this.mode === 'list'
        ? this.api.list(this.kind, this.archived())
        : this.id
          ? this.api.get(this.kind, this.id)
          : null;
    if (!request) {
      this.loading.set(false);
      return;
    }
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (value) => {
          if (Array.isArray(value)) this.rows.set(value);
          else {
            this.record.set(value);
            for (const field of this.config.fields)
              this.form
                .get(field.key)
                ?.setValue(
                  (value[field.key] as FieldValue) ??
                    (field.type === 'checkbox' ? false : field.type === 'number' ? null : ''),
                );
          }
        },
        error: (error) => this.handleError(error),
      });
  }
  loadChoices(): void {
    this.choiceError.set(false);
    const kinds =
      this.kind === 'warranties'
        ? ['assets']
        : ['assets', 'subscriptions', 'contracts', 'warranties'];
    forkJoin(kinds.map((kind) => this.api.list(kind, true)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.assets.set(
            groups[0].map((row) => ({
              id: row.id,
              name: row.name + (row.status === 'Archived' ? ' (gearchiveerd)' : ''),
            })),
          );
          this.choices.set(
            groups.flatMap((group, i) =>
              group
                .filter((row) => row.status !== 'Archived')
                .map((row) => ({
                  id: row.id,
                  name: `${['Bezitting', 'Abonnement', 'Contract', 'Garantie'][i]}: ${row.name}`,
                })),
            ),
          );
        },
        error: () => this.choiceError.set(true),
      });
  }
  options(field: RecordField): Choice[] {
    return field.key === 'assetId' ? this.assets() : (field.options ?? []);
  }
  field(key: string): RecordField {
    return this.config.fields.find((field) => field.key === key)!;
  }
  display(row: ArchiveRecord, field: RecordField): string {
    const value = row[field.key];
    if (value === null || value === undefined || value === '') return '—';
    if (field.type === 'checkbox') return value ? 'Ja' : 'Nee';
    if (field.type === 'date')
      return new Intl.DateTimeFormat('nl-BE', { dateStyle: 'medium', timeZone: 'UTC' }).format(
        new Date(`${value}T00:00:00Z`),
      );
    if (field.key === 'cost')
      return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(
        Number(value),
      );
    if (field.key === 'assetId') return String(row['assetName'] ?? 'Bezitting openen');
    return field.options?.find((option) => option.id === value)?.name ?? String(value);
  }
  selectFile(event: Event): void {
    this.file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (this.file && !this.form.get('name')?.value)
      this.form.get('name')?.setValue(this.file.name.replace(/\.[^.]+$/, ''));
  }
  save(): void {
    if (this.busy()) return;
    this.error.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Controleer de gemarkeerde velden.');
      return;
    }
    if (
      this.kind === 'documents' &&
      this.mode === 'new' &&
      (!this.file ||
        this.file.size === 0 ||
        this.file.size > 20 * 1024 * 1024 ||
        !/\.(pdf|png|jpe?g|webp|docx|xlsx|txt)$/i.test(this.file.name))
    ) {
      this.error.set(
        'Kies een niet-leeg PDF-, afbeeldings-, DOCX-, XLSX- of TXT-bestand van maximaal 20 MB.',
      );
      return;
    }
    const value = Object.fromEntries(
      Object.entries(this.form.getRawValue()).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() || null : value,
      ]),
    );
    let body: Record<string, FieldValue> | FormData = value;
    if (this.kind === 'documents' && this.mode === 'new') {
      body = new FormData();
      body.append('file', this.file!);
      for (const [key, entry] of Object.entries(value))
        if (entry !== null) body.append(key, String(entry));
      if (this.linkControl.value) body.append('itemId', this.linkControl.value);
    }
    this.busy.set(true);
    this.api
      .save(this.kind, this.id, body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (row) => void this.router.navigate(['/', this.kind, row.id]),
        error: (error) => this.handleError(error),
      });
  }
  archive(): void {
    if (!this.id || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api
      .archive(this.kind, this.id, this.record()?.status === 'Archived')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (row) => {
          this.record.set(row);
          this.confirmDelete.set(false);
          this.notice.set(
            row.status === 'Archived'
              ? 'Gearchiveerd. Je kunt dit item later herstellen.'
              : 'Het item is hersteld.',
          );
        },
        error: (error) => this.handleError(error),
      });
  }
  canPreview(): boolean {
    return ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(
      String(this.record()?.['mimeType']),
    );
  }
  closePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
    this.previewResource.set(null);
  }
  preview(): void {
    if (!this.id || this.busy() || !this.canPreview()) return;
    this.busy.set(true);
    this.error.set('');
    this.api
      .download(this.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (blob) => {
          this.closePreview();
          const url = URL.createObjectURL(
            new Blob([blob], { type: String(this.record()?.['mimeType']) }),
          );
          this.previewUrl.set(url);
          // Only a locally created blob from the protected, validated download endpoint is trusted.
          this.previewResource.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        },
        error: (error) => this.handleError(error),
      });
  }
  download(): void {
    if (!this.id || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api
      .download(this.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = String(this.record()?.['originalFileName'] ?? 'document');
          anchor.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: (error) => this.handleError(error),
      });
  }
  changeLink(itemId: string, remove = false): void {
    if (!this.id || !itemId || this.busy()) return;
    if (!remove && this.record()?.links?.some((link) => link.itemId === itemId)) return;
    this.busy.set(true);
    this.error.set('');
    (remove ? this.api.unlink(this.id, itemId) : this.api.link(this.id, itemId))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          this.linkControl.reset();
          this.notice.set(remove ? 'Koppeling verwijderd.' : 'Document gekoppeld.');
          this.load();
        },
        error: (error) => this.handleError(error),
      });
  }
  deleteDocument(): void {
    if (!this.id || this.busy() || !this.confirmDelete() || this.record()?.status !== 'Archived')
      return;
    this.busy.set(true);
    this.error.set('');
    this.api
      .delete(this.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigate(['/documents']),
        error: (error) => this.handleError(error),
      });
  }
  resetFilters(): void {
    this.search.set('');
    this.typeFilter.set('');
    this.archived.set(false);
    this.load();
  }
  private handleError(error: HttpErrorResponse): void {
    this.error.set(
      error.status === 404
        ? 'Dit item bestaat niet of is niet toegankelijk.'
        : error.status === 0
          ? 'De server is niet bereikbaar. Probeer het opnieuw.'
          : error.status === 413
            ? 'Het bestand is te groot.'
            : error.status === 400
              ? 'Controleer je gegevens, datums en bestandstype. Opslaan is niet gelukt.'
              : error.status === 409
                ? 'Deze actie is niet mogelijk. Controleer of de gekoppelde items actief zijn.'
                : 'De actie is mislukt. Probeer het opnieuw.',
    );
  }
}
