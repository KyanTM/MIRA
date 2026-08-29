import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AssetService } from '../data-access/asset.service';
import { AssetDetail as AssetDetailModel } from '../models';
import { AssetDetailPage } from './asset-detail';

describe('AssetDetailPage', () => {
  const asset: AssetDetailModel = {
    id: 'asset-1',
    name: 'Laptop',
    description: null,
    brand: 'Framework',
    model: 'Laptop 13',
    serialNumber: null,
    purchaseDate: null,
    purchasePrice: 1499,
    seller: null,
    location: null,
    currentValue: 1200,
    status: 'Active',
    createdAt: '2026-08-29T12:00:00Z',
    updatedAt: null,
    archivedAt: null,
  };

  it('replaces the active asset with the archived API response', async () => {
    const archivedAsset: AssetDetailModel = {
      ...asset,
      status: 'Archived',
      archivedAt: '2026-08-29T13:00:00Z',
      updatedAt: '2026-08-29T13:00:00Z',
    };
    const assetService = {
      getAsset: vi.fn().mockReturnValue(of(asset)),
      archiveAsset: vi.fn().mockReturnValue(of(archivedAsset)),
      restoreAsset: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AssetDetailPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => asset.id } } },
        },
        { provide: AssetService, useValue: assetService },
      ],
    }).compileComponents();

    TestBed.inject(Router);
    const component = TestBed.createComponent(AssetDetailPage).componentInstance;
    component.showArchiveConfirmation.set(true);

    component.archiveAsset();

    expect(assetService.archiveAsset).toHaveBeenCalledWith(asset.id);
    expect(component.asset()).toEqual(archivedAsset);
    expect(component.showArchiveConfirmation()).toBe(false);
    expect(component.successMessage()).toContain('gearchiveerd');
  });
});
