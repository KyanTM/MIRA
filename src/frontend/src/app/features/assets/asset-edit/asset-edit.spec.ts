import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MockInstance } from 'vitest';

import { AssetForm } from '../asset-form/asset-form';
import { AssetImageService } from '../data-access/asset-image.service';
import { AssetService } from '../data-access/asset.service';
import { AssetDetail, UpdateAssetRequest } from '../models';
import { AssetEdit } from './asset-edit';

describe('AssetEdit', () => {
  const request: UpdateAssetRequest = {
    name: 'Laptop',
    description: null,
    brand: 'Framework',
    model: 'Laptop 13',
    serialNumber: null,
    purchaseDate: null,
    purchasePrice: 1499,
    seller: null,
    location: 'Bureau',
    currentValue: 1200,
  };

  const savedAsset: AssetDetail = {
    ...request,
    id: 'asset-1',
    status: 'Active',
    createdAt: '2026-08-29T12:00:00Z',
    updatedAt: '2026-08-31T12:00:00Z',
    archivedAt: null,
  };

  let component: AssetEdit;
  let fixture: ComponentFixture<AssetEdit>;
  let assetService: {
    getAsset: ReturnType<typeof vi.fn>;
    updateAsset: ReturnType<typeof vi.fn>;
  };
  let imageService: { addImage: ReturnType<typeof vi.fn> };
  let navigate: MockInstance<Router['navigate']>;

  beforeEach(async () => {
    assetService = {
      getAsset: vi.fn().mockReturnValue(of(savedAsset)),
      updateAsset: vi.fn().mockReturnValue(of(savedAsset)),
    };
    imageService = { addImage: vi.fn().mockReturnValue(of(undefined)) };

    await TestBed.configureTestingModule({
      imports: [AssetEdit],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: savedAsset.id }) } },
        },
        { provide: AssetService, useValue: assetService },
        { provide: AssetImageService, useValue: imageService },
      ],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AssetEdit);
    component = fixture.componentInstance;
  });

  it('updates metadata without an image and opens the detail page', () => {
    component.updateAsset(request);

    expect(assetService.getAsset).toHaveBeenCalledWith(savedAsset.id);
    expect(assetService.updateAsset).toHaveBeenCalledWith(savedAsset.id, request);
    expect(imageService.addImage).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/assets', savedAsset.id], {
      state: { message: 'Wijzigingen opgeslagen.' },
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('receives the image selection from the reusable form', () => {
    fixture.detectChanges();
    const file = new File(['photo'], 'laptop.webp', { type: 'image/webp' });
    const form = fixture.debugElement.query(By.directive(AssetForm)).componentInstance as AssetForm;

    form.imageSelected.emit(file);

    expect(component.selectedImage()).toBe(file);
  });

  it('updates metadata before adding the image and stays busy until both finish', () => {
    const saveRequest = new Subject<AssetDetail>();
    const uploadRequest = new Subject<void>();
    const file = new File(['photo'], 'laptop.webp', { type: 'image/webp' });
    assetService.updateAsset.mockReturnValue(saveRequest);
    imageService.addImage.mockReturnValue(uploadRequest);
    component.selectedImage.set(file);

    component.updateAsset(request);
    component.updateAsset(request);

    expect(component.isSubmitting()).toBe(true);
    expect(assetService.updateAsset).toHaveBeenCalledTimes(1);
    expect(imageService.addImage).not.toHaveBeenCalled();

    saveRequest.next(savedAsset);
    saveRequest.complete();

    expect(imageService.addImage).toHaveBeenCalledWith(savedAsset.id, file);
    expect(component.isSubmitting()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();

    uploadRequest.next();
    uploadRequest.complete();

    expect(navigate).toHaveBeenCalledWith(['/assets', savedAsset.id], {
      state: { message: 'Wijzigingen opgeslagen.' },
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('opens the saved changes with a warning when the image upload fails', () => {
    imageService.addImage.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    component.selectedImage.set(new File(['photo'], 'laptop.jpg', { type: 'image/jpeg' }));

    component.updateAsset(request);
    component.updateAsset(request);

    expect(assetService.updateAsset).toHaveBeenCalledTimes(1);
    expect(imageService.addImage).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/assets', savedAsset.id], {
      state: {
        message: 'Wijzigingen opgeslagen.',
        warning: expect.stringContaining('Je wijzigingen zijn opgeslagen.'),
      },
    });
    expect(component.serverError()).toBeNull();
    expect(component.isSubmitting()).toBe(false);
  });

  it('does not upload the same image again while navigation is pending', () => {
    navigate.mockReturnValue(new Promise<boolean>(() => {}));
    component.selectedImage.set(new File(['photo'], 'laptop.png', { type: 'image/png' }));

    component.updateAsset(request);
    component.updateAsset(request);

    expect(assetService.updateAsset).toHaveBeenCalledTimes(1);
    expect(imageService.addImage).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('does not upload an image if the metadata update fails', () => {
    assetService.updateAsset.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400 })),
    );
    component.selectedImage.set(new File(['photo'], 'laptop.png', { type: 'image/png' }));

    component.updateAsset(request);

    expect(imageService.addImage).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.serverError()).toContain('Controleer de ingevulde gegevens');
    expect(component.isSubmitting()).toBe(false);
  });

  it('disables image selection for an archived asset', () => {
    component.asset.set({ ...savedAsset, status: 'Archived', archivedAt: '2026-08-31T13:00:00Z' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#asset-image')?.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Herstel deze bezitting eerst');
  });

  it('cancels a metadata update when the page is destroyed', () => {
    const saveRequest = new Subject<AssetDetail>();
    assetService.updateAsset.mockReturnValue(saveRequest);
    component.selectedImage.set(new File(['photo'], 'laptop.png', { type: 'image/png' }));

    component.updateAsset(request);
    fixture.destroy();
    saveRequest.next(savedAsset);

    expect(imageService.addImage).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('cancels a pending image upload when the page is destroyed', () => {
    const uploadRequest = new Subject<void>();
    imageService.addImage.mockReturnValue(uploadRequest);
    component.selectedImage.set(new File(['photo'], 'laptop.png', { type: 'image/png' }));

    component.updateAsset(request);
    fixture.destroy();
    uploadRequest.next();
    uploadRequest.complete();

    expect(uploadRequest.observed).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });
});
