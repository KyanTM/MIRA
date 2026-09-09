import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RecordService } from './record.service';
import { ArchiveRecord } from './record-config';

@Component({
  selector: 'app-contract-picker',
  imports: [ReactiveFormsModule, RouterLink],
  template: `<label for="subscription-contract" class="field-label">Gekoppeld contract</label>
    <select id="subscription-contract" class="field-control" [formControl]="control()">
      <option value="">Geen contract</option>
      @if (control().value && !hasSelected()) {
        <option [value]="control().value">Huidig gekoppeld contract</option>
      }
      @for (contract of contracts(); track contract.id) {
        <option [value]="contract.id">
          {{ contract.name }}{{ contract.status === 'Archived' ? ' (gearchiveerd)' : '' }}
        </option>
      }
    </select>
    @if (error()) {
      <p class="field-error" role="alert">
        Contracten laden is mislukt. De bestaande koppeling blijft bewaard.
        <button class="button button--quiet" type="button" (click)="load()">
          Opnieuw proberen
        </button>
      </p>
    }
    @if (!disabled()) {
      <p class="field-hint"><a routerLink="/contracts/new">Contract toevoegen</a></p>
    }`,
})
export class ContractPicker {
  private readonly api = inject(RecordService);
  private readonly destroyRef = inject(DestroyRef);
  readonly disabled = input(false);
  readonly control = input.required<FormControl<string>>();
  readonly contracts = signal<ArchiveRecord[]>([]);
  readonly error = signal(false);
  constructor() {
    this.load();
  }
  hasSelected() {
    return this.contracts().some((contract) => contract.id === this.control().value);
  }
  load() {
    this.error.set(false);
    this.api
      .list('contracts', true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (rows) => this.contracts.set(rows), error: () => this.error.set(true) });
  }
}
