import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { AssetService } from '../data-access/asset.service';
import { AssetSummary } from '../models';
import { AssetList } from './asset-list';

describe('AssetList', () => {
  let component: AssetList;
  let fixture: ComponentFixture<AssetList>;
  let assetService: {
    getAssets: ReturnType<typeof vi.fn>;
  };

  const assets: AssetSummary[] = [
    {
      id: 'asset-1',
      name: 'Werklaptop',
      brand: 'Framework',
      model: 'Laptop 13',
      serialNumber: 'MIRA-001',
      purchaseDate: '2026-08-01',
      purchasePrice: 1499.95,
      status: 'Active',
      createdAt: '2026-08-01T10:00:00Z',
    },
    {
      id: 'asset-2',
      name: 'Fotocamera',
      brand: 'Sony',
      model: 'A7 IV',
      serialNumber: null,
      purchaseDate: null,
      purchasePrice: null,
      status: 'Active',
      createdAt: '2026-08-02T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    assetService = {
      getAssets: vi.fn().mockReturnValue(of(assets)),
    };

    await TestBed.configureTestingModule({
      imports: [AssetList],
      providers: [provideRouter([]), { provide: AssetService, useValue: assetService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads active assets on creation', () => {
    expect(assetService.getAssets).toHaveBeenCalledWith(false);
    expect(component.assets()).toEqual(assets);
    expect(component.isLoading()).toBe(false);
  });

  it('searches case-insensitively across name, brand, model and serial number', () => {
    component.setSearchTerm('FRAMEWORK');
    expect(component.filteredAssets().map((asset) => asset.id)).toEqual(['asset-1']);

    component.setSearchTerm('a7 iv');
    expect(component.filteredAssets().map((asset) => asset.id)).toEqual(['asset-2']);

    component.setSearchTerm('mira-001');
    expect(component.filteredAssets().map((asset) => asset.id)).toEqual(['asset-1']);
  });

  it('refetches assets when archived items are enabled', () => {
    component.setIncludeArchived(true);

    expect(component.includeArchived()).toBe(true);
    expect(assetService.getAssets).toHaveBeenLastCalledWith(true);
  });

  it('ignores an older response after the archive filter changes again', () => {
    const archivedRequest = new Subject<AssetSummary[]>();
    const activeRequest = new Subject<AssetSummary[]>();
    assetService.getAssets.mockReturnValueOnce(archivedRequest).mockReturnValueOnce(activeRequest);

    component.setIncludeArchived(true);
    component.setIncludeArchived(false);

    archivedRequest.next([{ ...assets[0], id: 'stale-asset', status: 'Archived' }]);
    activeRequest.next(assets);
    activeRequest.complete();

    expect(component.assets()).toEqual(assets);
    expect(component.includeArchived()).toBe(false);
    expect(component.isLoading()).toBe(false);
  });
});
