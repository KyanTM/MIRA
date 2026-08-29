import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { AssetService } from '../data-access/asset.service';
import { AssetDetail, CreateAssetRequest } from '../models';
import { AssetCreate } from './asset-create';

describe('AssetCreate', () => {
  const request: CreateAssetRequest = {
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
  };

  const createdAsset: AssetDetail = {
    ...request,
    id: 'asset-1',
    status: 'Active',
    createdAt: '2026-08-29T12:00:00Z',
    updatedAt: null,
    archivedAt: null,
  };

  it('creates the asset and opens its detail page', async () => {
    const assetService = {
      createAsset: vi.fn().mockReturnValue(of(createdAsset)),
    };

    await TestBed.configureTestingModule({
      imports: [AssetCreate],
      providers: [provideRouter([]), { provide: AssetService, useValue: assetService }],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = TestBed.createComponent(AssetCreate).componentInstance;

    component.createAsset(request);

    expect(assetService.createAsset).toHaveBeenCalledWith(request);
    expect(navigate).toHaveBeenCalledWith(['/assets', createdAsset.id], {
      state: { message: 'Bezitting toegevoegd.' },
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('does not navigate after the page is destroyed during a save request', async () => {
    const saveRequest = new Subject<AssetDetail>();
    const assetService = {
      createAsset: vi.fn().mockReturnValue(saveRequest),
    };

    await TestBed.configureTestingModule({
      imports: [AssetCreate],
      providers: [provideRouter([]), { provide: AssetService, useValue: assetService }],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AssetCreate);
    const component = fixture.componentInstance;

    component.createAsset(request);
    fixture.destroy();
    saveRequest.next(createdAsset);

    expect(navigate).not.toHaveBeenCalled();
  });
});
