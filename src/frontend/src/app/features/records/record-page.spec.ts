import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RecordPage } from './record-page';
import { RecordService } from './record.service';
import { RecordKind } from './record-config';

describe('RecordPage', () => {
  let api: {
    list: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    archive: ReturnType<typeof vi.fn>;
    link: ReturnType<typeof vi.fn>;
    unlink: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  beforeEach(() => {
    api = {
      list: vi.fn().mockReturnValue(of([])),
      get: vi.fn().mockReturnValue(of({ id: 'record-1', name: 'Contract', status: 'Active' })),
      save: vi.fn().mockReturnValue(of({ id: 'created' })),
      archive: vi.fn().mockReturnValue(of({ id: 'record-1', status: 'Archived' })),
      link: vi.fn().mockReturnValue(of({})),
      unlink: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
    };
  });
  function create(kind: RecordKind, mode = 'new', query = {}) {
    TestBed.configureTestingModule({
      imports: [RecordPage],
      providers: [
        provideRouter([]),
        { provide: RecordService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { kind, mode },
              paramMap: convertToParamMap(
                mode === 'detail' || mode === 'edit' ? { id: 'record-1' } : {},
              ),
              queryParamMap: convertToParamMap(query),
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(RecordPage);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    return fixture;
  }
  it('rejects missing fields, whitespace names, negative cost and reversed contract dates', () => {
    const page = create('contracts').componentInstance;
    page.form.patchValue({
      name: ' ',
      contractParty: 'Provider',
      startsOn: '2026-09-10',
      endsOn: '2026-09-01',
      cost: -1,
    });
    page.save();
    expect(page.form.invalid).toBe(true);
    expect(page.form.hasError('dateOrder')).toBe(true);
    expect(api.save).not.toHaveBeenCalled();
  });
  it('saves a normalized contract and preserves zero cost', () => {
    const page = create('contracts').componentInstance;
    page.form.patchValue({
      name: ' Internet ',
      contractParty: ' Provider ',
      startsOn: '2026-09-01',
      cost: 0,
    });
    page.save();
    expect(api.save).toHaveBeenCalledWith(
      'contracts',
      null,
      expect.objectContaining({
        name: 'Internet',
        contractParty: 'Provider',
        cost: 0,
        endsOn: null,
        automaticallyRenews: false,
      }),
    );
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/', 'contracts', 'created']);
  });
  it('requires a linked asset and supports the asset-detail shortcut', () => {
    const page = create('warranties', 'new', { assetId: 'asset-1' }).componentInstance;
    page.form.patchValue({
      name: 'Laptopgarantie',
      provider: 'Winkel',
      startsOn: '2026-09-01',
      endsOn: '2028-09-01',
    });
    page.save();
    expect(api.save).toHaveBeenCalledWith(
      'warranties',
      null,
      expect.objectContaining({ assetId: 'asset-1' }),
    );
    page.form.get('assetId')!.setValue('');
    expect(page.form.invalid).toBe(true);
  });
  it('uploads the file and optional item link together as multipart data', () => {
    const page = create('documents', 'new', { itemId: 'asset-1' }).componentInstance;
    page.form.patchValue({ name: 'Factuur', documentType: 'Invoice' });
    page.file = new File(['%PDF-1.7'], 'factuur.pdf', { type: 'application/pdf' });
    page.save();
    const body = api.save.mock.calls[0][2] as FormData;
    expect(body.get('file')).toBe(page.file);
    expect(body.get('itemId')).toBe('asset-1');
    expect(body.get('documentType')).toBe('Invoice');
    expect(body.has('expiresOn')).toBe(false);
  });
  it('rejects missing, empty and unsupported uploads without making a request', () => {
    const page = create('documents').componentInstance;
    page.form.patchValue({ name: 'Document' });
    page.save();
    page.file = new File([], 'empty.pdf');
    page.save();
    page.file = new File(['script'], 'script.exe');
    page.save();
    expect(api.save).not.toHaveBeenCalled();
    expect(page.error()).toContain('bestand');
  });
  it('keeps entered values after a server failure and allows retry', () => {
    api.save.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const page = create('contracts').componentInstance;
    page.form.patchValue({ name: 'Internet', contractParty: 'Provider', startsOn: '2026-09-01' });
    page.save();
    expect(page.busy()).toBe(false);
    expect(page.form.get('name')!.value).toBe('Internet');
    expect(page.error()).toContain('niet bereikbaar');
  });
  it('filters documents by search and type and resets filters', () => {
    api.list.mockReturnValue(
      of([
        {
          id: 'one',
          name: 'Laptopfactuur',
          documentType: 'Invoice',
          issuer: 'Winkel',
          status: 'Active',
        },
        { id: 'two', name: 'Handleiding', documentType: 'Manual', status: 'Active' },
      ]),
    );
    const page = create('documents', 'list').componentInstance;
    page.search.set(' WINKEL ');
    page.typeFilter.set('Invoice');
    expect(page.filtered().map((row) => row.id)).toEqual(['one']);
    page.resetFilters();
    expect(page.filtered()).toHaveLength(2);
  });
  it('prevents permanent deletion until archived and explicitly confirmed', () => {
    const page = create('documents', 'detail').componentInstance;
    page.confirmDelete.set(true);
    page.deleteDocument();
    expect(api.delete).not.toHaveBeenCalled();
    page.archive();
    expect(api.archive).toHaveBeenCalledWith('documents', 'record-1', false);
    page.confirmDelete.set(false);
    page.deleteDocument();
    expect(api.delete).not.toHaveBeenCalled();
    page.confirmDelete.set(true);
    page.deleteDocument();
    expect(api.delete).toHaveBeenCalledWith('record-1');
  });
  it('does not replace an existing image role with an attachment', () => {
    const page = create('documents', 'detail').componentInstance;
    page.record.set({
      id: 'record-1',
      name: 'Foto',
      status: 'Active',
      links: [{ itemId: 'asset-1', itemName: 'Laptop', itemType: 'Asset', role: 'PrimaryImage' }],
    });
    page.choices.set([
      { id: 'asset-1', name: 'Laptop' },
      { id: 'asset-2', name: 'Fiets' },
    ]);
    expect(page.availableChoices().map((choice) => choice.id)).toEqual(['asset-2']);
    page.changeLink('asset-1');
    expect(api.link).not.toHaveBeenCalled();
  });

  it('shows a recoverable error for an inaccessible record', () => {
    api.get.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const fixture = create('contracts', 'detail');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('niet toegankelijk');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});
