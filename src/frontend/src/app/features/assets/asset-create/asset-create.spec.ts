import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MockInstance } from 'vitest';

import { AssetForm } from '../asset-form/asset-form';
import { AssetImageService } from '../data-access/asset-image.service';
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

  let component: AssetCreate;
  let fixture: ComponentFixture<AssetCreate>;
  let assetService: { createAsset: ReturnType<typeof vi.fn> };
  let imageService: { uploadImage: ReturnType<typeof vi.fn> };
  let navigate: MockInstance<Router['navigate']>;

  beforeEach(async () => {
    assetService = { createAsset: vi.fn().mockReturnValue(of(createdAsset)) };
    imageService = { uploadImage: vi.fn().mockReturnValue(of(undefined)) };

    await TestBed.configureTestingModule({
      imports: [AssetCreate],
      providers: [
        provideRouter([]),
        { provide: AssetService, useValue: assetService },
        { provide: AssetImageService, useValue: imageService },
      ],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AssetCreate);
    component = fixture.componentInstance;
  });

  it('creates the asset without an image and opens its detail page', () => {
    component.createAsset(request);

    expect(assetService.createAsset).toHaveBeenCalledWith(request);
    expect(imageService.uploadImage).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/assets', createdAsset.id], {
      state: { message: 'Bezitting toegevoegd.' },
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('receives the image selection from the reusable form', () => {
    fixture.detectChanges();
    const file = new File(['photo'], 'laptop.png', { type: 'image/png' });
    const form = fixture.debugElement.query(By.directive(AssetForm)).componentInstance as AssetForm;

    form.imageSelected.emit(file);

    expect(component.selectedImage()).toBe(file);
  });

  it('saves metadata before uploading the primary image and stays busy until both finish', () => {
    const saveRequest = new Subject<AssetDetail>();
    const uploadRequest = new Subject<void>();
    const file = new File(['photo'], 'laptop.png', { type: 'image/png' });
    assetService.createAsset.mockReturnValue(saveRequest);
    imageService.uploadImage.mockReturnValue(uploadRequest);
    component.selectedImage.set(file);

    component.createAsset(request);
    component.createAsset(request);

    expect(component.isSubmitting()).toBe(true);
    expect(assetService.createAsset).toHaveBeenCalledTimes(1);
    expect(imageService.uploadImage).not.toHaveBeenCalled();

    saveRequest.next(createdAsset);
    saveRequest.complete();

    expect(imageService.uploadImage).toHaveBeenCalledWith(createdAsset.id, file, 'PrimaryImage');
    expect(component.isSubmitting()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();

    uploadRequest.next();
    uploadRequest.complete();

    expect(navigate).toHaveBeenCalledWith(['/assets', createdAsset.id], {
      state: { message: 'Bezitting toegevoegd.' },
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('opens the saved asset with a warning when image upload fails, without creating a duplicate', () => {
    imageService.uploadImage.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400 })),
    );
    component.selectedImage.set(new File(['photo'], 'laptop.png', { type: 'image/png' }));

    component.createAsset(request);
    component.createAsset(request);

    expect(assetService.createAsset).toHaveBeenCalledTimes(1);
    expect(imageService.uploadImage).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/assets', createdAsset.id], {
      state: {
        message: 'Bezitting toegevoegd.',
        warning: expect.stringContaining('De bezitting is opgeslagen.'),
      },
    });
    expect(component.serverError()).toBeNull();
    expect(component.isSubmitting()).toBe(false);
  });

  it('does not upload an image when metadata saving fails and allows retrying the save', () => {
    assetService.createAsset.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 400 })),
    );
    component.selectedImage.set(new File(['photo'], 'laptop.png', { type: 'image/png' }));

    component.createAsset(request);

    expect(imageService.uploadImage).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.serverError()).toContain('Controleer de ingevulde gegevens');
    expect(component.isSubmitting()).toBe(false);

    component.createAsset(request);

    expect(assetService.createAsset).toHaveBeenCalledTimes(2);
    expect(imageService.uploadImage).toHaveBeenCalledTimes(1);
    expect(component.serverError()).toBeNull();
  });

  it('cancels metadata saving when the page is destroyed and never starts the image upload', () => {
    const saveRequest = new Subject<AssetDetail>();
    assetService.createAsset.mockReturnValue(saveRequest);
    component.selectedImage.set(new File(['photo'], 'laptop.png', { type: 'image/png' }));

    component.createAsset(request);
    fixture.destroy();
    saveRequest.next(createdAsset);

    expect(imageService.uploadImage).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('cancels a pending image upload when the page is destroyed', () => {
    const uploadRequest = new Subject<void>();
    imageService.uploadImage.mockReturnValue(uploadRequest);
    component.selectedImage.set(new File(['photo'], 'laptop.png', { type: 'image/png' }));

    component.createAsset(request);
    fixture.destroy();
    uploadRequest.next();
    uploadRequest.complete();

    expect(uploadRequest.observed).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });
});
