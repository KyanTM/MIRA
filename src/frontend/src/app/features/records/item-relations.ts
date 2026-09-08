import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { DateOnlyPipe } from '../../shared/date-only.pipe';
import { ArchiveRecord } from './record-config';
import { RecordService } from './record.service';

@Component({
  selector: 'app-item-relations',
  imports: [RouterLink, DateOnlyPipe],
  template: `
    <section class="relations" aria-label="Gekoppelde gegevens">
      <header>
        <h2>Documenten</h2>
        @if (!archived()) {
          <a
            class="button button--secondary"
            routerLink="/documents/new"
            [queryParams]="{ itemId: itemId() }"
            >Document toevoegen</a
          >
        }
      </header>
      @if (error()) {
        <p role="alert">
          De gekoppelde gegevens konden niet laden.
          <button class="button button--quiet" (click)="reload.update(valuePlusOne)">
            Opnieuw proberen
          </button>
        </p>
      }
      @if (loading()) {
        <p role="status">Gekoppelde gegevens laden…</p>
      } @else if (!error()) {
        <ul>
          @for (document of documents(); track document.id) {
            <li>
              <a [routerLink]="['/documents', document.id]">{{ document.name }}</a
              ><span>{{ document['originalFileName'] }}</span>
            </li>
          } @empty {
            <li>Geen documenten gekoppeld.</li>
          }
        </ul>
        @if (!archived()) {
          <p class="hint">
            Een bestaand document koppelen? Open het in <a routerLink="/documents">Documenten</a> en
            kies dit item onder ‘Item koppelen’.
          </p>
        }
      }
      @if (showWarranties()) {
        <header>
          <h2>Garanties</h2>
          @if (!archived()) {
            <a
              class="button button--secondary"
              routerLink="/warranties/new"
              [queryParams]="{ assetId: itemId() }"
              >Garantie toevoegen</a
            >
          }
        </header>
        @if (!loading() && !error()) {
          <ul>
            @for (warranty of warranties(); track warranty.id) {
              <li>
                <a [routerLink]="['/warranties', warranty.id]">{{ warranty.name }}</a
                ><span>Tot {{ dateValue(warranty['endsOn']) | dateOnly }}</span>
              </li>
            } @empty {
              <li>Geen garanties gekoppeld.</li>
            }
          </ul>
        }
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .relations {
      border-top: 1px solid var(--mira-border);
      margin-top: 1.5rem;
      padding-top: 1.25rem;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    h2 {
      font-size: 1.125rem;
      font-weight: 650;
      margin: 0;
    }
    ul {
      padding: 0;
      list-style: none;
      margin-bottom: 1.5rem;
    }
    li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--mira-border);
      font-size: 0.875rem;
      overflow-wrap: anywhere;
    }
    a:not(.button) {
      color: var(--mira-blue-800);
    }
    span,
    .hint {
      color: var(--mira-text-muted);
      font-size: 0.8125rem;
    }
    @media (max-width: 640px) {
      li {
        flex-direction: column;
        gap: 0.25rem;
      }
    }
  `,
})
export class ItemRelations {
  private readonly api = inject(RecordService);
  readonly itemId = input.required<string>();
  readonly archived = input(false);
  readonly showWarranties = input(false);
  readonly documents = signal<ArchiveRecord[]>([]);
  readonly warranties = signal<ArchiveRecord[]>([]);
  readonly error = signal(false);
  readonly loading = signal(true);
  readonly reload = signal(0);
  readonly valuePlusOne = (value: number) => value + 1;
  readonly dateValue = (value: unknown) => (typeof value === 'string' ? value : null);
  constructor() {
    effect((onCleanup) => {
      this.reload();
      this.loading.set(true);
      this.error.set(false);
      const subscription = forkJoin({
        documents: this.api.list('documents', false, this.itemId()),
        warranties: this.showWarranties()
          ? this.api.list('warranties', false, this.itemId())
          : of([]),
      }).subscribe({
        next: (result) => {
          this.documents.set(result.documents);
          this.warranties.set(result.warranties);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
