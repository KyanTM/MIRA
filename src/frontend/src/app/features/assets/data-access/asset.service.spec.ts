import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AssetDetail, AssetSummary, CreateAssetRequest, UpdateAssetRequest } from '../models';
import { AssetService } from './asset.service';

describe('AssetService', () => {
  let assetService: AssetService;
  let httpTesting: HttpTestingController;

  const assetId = '9c0ccedf-f102-429c-b9b5-058494883b75';

  const assetSummary: AssetSummary = {
    id: assetId,
    name: 'Laptop',
    brand: 'Framework',
    model: 'Laptop 13',
    serialNumber: 'MIRA-001',
    purchaseDate: '2026-08-01',
    purchasePrice: 1499.95,
    status: 'Active',
    createdAt: '2026-08-01T10:15:30+00:00',
  };

  const assetDetail: AssetDetail = {
    ...assetSummary,
    description: 'Persoonlijke laptop',
    seller: 'Framework',
    location: 'Thuiskantoor',
    currentValue: 0,
    updatedAt: null,
    archivedAt: null,
  };

  const createRequest: CreateAssetRequest = {
    name: 'Laptop',
    description: 'Persoonlijke laptop',
    brand: 'Framework',
    model: 'Laptop 13',
    serialNumber: 'MIRA-001',
    purchaseDate: '2026-08-01',
    purchasePrice: 1499.95,
    seller: 'Framework',
    location: 'Thuiskantoor',
    currentValue: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssetService, provideHttpClient(), provideHttpClientTesting()],
    });

    assetService = TestBed.inject(AssetService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('gets active assets without an archived query parameter by default', async () => {
    const resultPromise = firstValueFrom(assetService.getAssets());

    const request = httpTesting.expectOne(`${environment.apiUrl}/assets`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('includeArchived')).toBe(false);
    request.flush([assetSummary]);

    expect(await resultPromise).toEqual([assetSummary]);
  });

  it('requests archived assets when includeArchived is true', async () => {
    const resultPromise = firstValueFrom(assetService.getAssets(true));

    const request = httpTesting.expectOne(`${environment.apiUrl}/assets?includeArchived=true`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('includeArchived')).toBe('true');
    request.flush([assetSummary]);

    expect(await resultPromise).toEqual([assetSummary]);
  });

  it('gets one asset by id', async () => {
    const resultPromise = firstValueFrom(assetService.getAsset(assetId));

    const request = httpTesting.expectOne(`${environment.apiUrl}/assets/${assetId}`);
    expect(request.request.method).toBe('GET');
    request.flush(assetDetail);

    expect(await resultPromise).toEqual(assetDetail);
  });

  it('creates an asset with the exact request body', async () => {
    const resultPromise = firstValueFrom(assetService.createAsset(createRequest));

    const request = httpTesting.expectOne(`${environment.apiUrl}/assets`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(createRequest);
    expect(request.request.body.currentValue).toBe(0);
    request.flush(assetDetail);

    expect(await resultPromise).toEqual(assetDetail);
  });

  it('updates an asset with the exact request body', async () => {
    const updateRequest: UpdateAssetRequest = {
      ...createRequest,
      name: 'Bijgewerkte laptop',
      description: null,
    };
    const updatedAsset: AssetDetail = {
      ...assetDetail,
      name: updateRequest.name,
      description: null,
      updatedAt: '2026-08-29T12:00:00+00:00',
    };
    const resultPromise = firstValueFrom(assetService.updateAsset(assetId, updateRequest));

    const request = httpTesting.expectOne(`${environment.apiUrl}/assets/${assetId}`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(updateRequest);
    request.flush(updatedAsset);

    expect(await resultPromise).toEqual(updatedAsset);
  });

  it('archives an asset with an empty PATCH body', async () => {
    const archivedAsset: AssetDetail = {
      ...assetDetail,
      status: 'Archived',
      updatedAt: '2026-08-29T12:00:00+00:00',
      archivedAt: '2026-08-29T12:00:00+00:00',
    };
    const resultPromise = firstValueFrom(assetService.archiveAsset(assetId));

    const request = httpTesting.expectOne(`${environment.apiUrl}/assets/${assetId}/archive`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    request.flush(archivedAsset);

    expect(await resultPromise).toEqual(archivedAsset);
  });

  it('restores an asset with an empty PATCH body', async () => {
    const resultPromise = firstValueFrom(assetService.restoreAsset(assetId));

    const request = httpTesting.expectOne(`${environment.apiUrl}/assets/${assetId}/restore`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    request.flush(assetDetail);

    expect(await resultPromise).toEqual(assetDetail);
  });
});
