import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { AssetImageService } from '../data-access/asset-image.service';
import { AssetImage } from '../image-models';
import { AssetImages } from './asset-images';

describe('AssetImages', () => {
  const primary: AssetImage = {
    id: 'photo-1',
    name: 'Laptop voorzijde',
    originalFileName: 'laptop.jpg',
    mimeType: 'image/jpeg',
    fileSizeBytes: 1024,
    status: 'Active',
    role: 'PrimaryImage',
  };
  const gallery: AssetImage = {
    ...primary,
    id: 'photo-2',
    name: 'Laptop achterzijde',
    originalFileName: 'achterzijde.jpg',
    role: 'GalleryImage',
  };
  let fixture: ComponentFixture<AssetImages>;
  let component: AssetImages;
  let imageService: {
    getImages: ReturnType<typeof vi.fn>;
    getImageContent: ReturnType<typeof vi.fn>;
    addImage: ReturnType<typeof vi.fn>;
    makePrimary: ReturnType<typeof vi.fn>;
    unlinkImage: ReturnType<typeof vi.fn>;
  };
  const originalUrl = globalThis.URL;
  let createObjectURL: ReturnType<typeof vi.fn<(blob: Blob | MediaSource) => string>>;
  let revokeObjectURL: ReturnType<typeof vi.fn<(url: string) => void>>;

  beforeEach(async () => {
    let urlId = 0;
    createObjectURL = vi.fn(() => `blob:preview-${++urlId}`);
    revokeObjectURL = vi.fn();
    vi.stubGlobal(
      'URL',
      class extends originalUrl {
        static override createObjectURL = createObjectURL;
        static override revokeObjectURL = revokeObjectURL;
      },
    );
    imageService = {
      getImages: vi.fn().mockReturnValue(of([primary, gallery])),
      getImageContent: vi.fn().mockReturnValue(of(new Blob(['image'], { type: 'image/jpeg' }))),
      addImage: vi.fn().mockReturnValue(of(gallery)),
      makePrimary: vi.fn().mockReturnValue(of(undefined)),
      unlinkImage: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [AssetImages],
      providers: [{ provide: AssetImageService, useValue: imageService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetImages);
    fixture.componentRef.setInput('assetId', 'asset-1');
    fixture.componentRef.setInput('assetName', 'Laptop');
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  it('loads the image links and only downloads the selected private preview', () => {
    fixture.detectChanges();

    expect(imageService.getImages).toHaveBeenCalledWith('asset-1');
    expect(imageService.getImageContent).toHaveBeenCalledExactlyOnceWith(primary.id);
    expect(component.selectedImage()?.id).toBe(primary.id);
    expect(fixture.nativeElement.querySelector('img')?.getAttribute('src')).toBe('blob:preview-1');
    expect(fixture.nativeElement.textContent).toContain('Hoofdafbeelding');
  });

  it('releases the previous preview when selecting another image and on destroy', () => {
    fixture.detectChanges();
    component.selectImage(gallery.id);
    fixture.detectChanges();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
    expect(imageService.getImageContent).toHaveBeenLastCalledWith(gallery.id);
    expect(component.previewUrl()).toBe('blob:preview-2');

    fixture.destroy();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-2');
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('cancels stale preview downloads when the selected image changes', () => {
    const oldPreview = new Subject<Blob>();
    imageService.getImageContent.mockReturnValueOnce(oldPreview);
    fixture.detectChanges();
    component.selectImage(gallery.id);
    fixture.detectChanges();
    oldPreview.next(new Blob(['stale']));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(component.previewUrl()).toBe('blob:preview-1');
  });

  it('offers a retry when an image cannot be downloaded or decoded', () => {
    imageService.getImageContent.mockReturnValueOnce(throwError(() => new Error('download')));
    fixture.detectChanges();

    expect(component.previewError()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Voorbeeld opnieuw laden');

    component.retryPreview();
    fixture.detectChanges();
    expect(component.previewUrl()).toBe('blob:preview-1');

    component.onPreviewError('blob:preview-1');
    expect(component.previewUrl()).toBeNull();
    expect(component.previewError()).toBe(true);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
  });

  it('ignores a decode error from a previously selected image', () => {
    fixture.detectChanges();
    component.selectImage(gallery.id);
    fixture.detectChanges();
    component.onPreviewError('blob:preview-1');

    expect(component.previewUrl()).toBe('blob:preview-2');
    expect(component.previewError()).toBe(false);
  });

  it('shows a useful empty state and permits uploading the first image', () => {
    imageService.getImages.mockReturnValue(of([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nog geen afbeelding');
    expect(fixture.nativeElement.querySelector('app-image-picker')).not.toBeNull();
    expect(imageService.getImageContent).not.toHaveBeenCalled();
  });

  it('uploads once, retains its busy state, clears the picker and refreshes the image links', () => {
    const upload = new Subject<AssetImage>();
    imageService.addImage.mockReturnValue(upload);
    const file = new File(['image'], 'new.jpg', { type: 'image/jpeg' });
    const imageAdded = vi.fn();
    component.imageAdded.subscribe(imageAdded);
    fixture.detectChanges();
    component.selectFile({ file, error: null });

    component.uploadImage();
    component.uploadImage();
    expect(imageService.addImage).toHaveBeenCalledExactlyOnceWith('asset-1', file);
    expect(component.isBusy()).toBe(true);

    upload.next(gallery);
    upload.complete();
    fixture.detectChanges();

    expect(component.isBusy()).toBe(false);
    expect(component.selectedFile()).toBeNull();
    expect(component.selectedImage()?.id).toBe(gallery.id);
    expect(component.successMessage()).toBe('Afbeelding toegevoegd.');
    expect(imageAdded).toHaveBeenCalledOnce();
    expect(imageService.getImages).toHaveBeenCalledTimes(2);
  });

  it('preserves the selected file after an upload failure and reports the supported formats', () => {
    const file = new File(['image'], 'new.jpg', { type: 'image/jpeg' });
    imageService.addImage.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 413 })));
    fixture.detectChanges();
    component.selectFile({ file, error: null });
    component.uploadImage();

    expect(component.selectedFile()).toBe(file);
    expect(component.actionError()).toContain('20 MB');
    expect(component.isBusy()).toBe(false);
    expect(component.successMessage()).toBeNull();
  });

  it('does not upload an invalid selection', () => {
    fixture.detectChanges();
    component.selectFile({ file: null, error: 'Ongeldig bestand' });
    component.uploadImage();

    expect(imageService.addImage).not.toHaveBeenCalled();
  });

  it('sets a different primary image and refreshes the server state after a conflict', () => {
    fixture.detectChanges();
    component.selectImage(gallery.id);
    imageService.makePrimary.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );
    component.makePrimary();

    expect(imageService.makePrimary).toHaveBeenCalledWith('asset-1', gallery.id, primary.id);
    expect(imageService.getImages).toHaveBeenCalledTimes(2);
    expect(component.actionError()).toContain('intussen gewijzigd');
    expect(component.isBusy()).toBe(false);
  });

  it('does not replace an archived primary image until that link is removed', () => {
    imageService.getImages.mockReturnValue(of([{ ...primary, status: 'Archived' }, gallery]));
    fixture.detectChanges();
    component.selectImage(gallery.id);
    fixture.detectChanges();
    component.makePrimary();

    expect(imageService.makePrimary).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Ontkoppel die eerst');
  });

  it('requires confirmation and only removes the image link', () => {
    fixture.detectChanges();
    component.unlinkImage();
    expect(imageService.unlinkImage).not.toHaveBeenCalled();

    component.requestUnlink();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('wordt niet verwijderd');
    component.unlinkImage();

    expect(imageService.unlinkImage).toHaveBeenCalledExactlyOnceWith('asset-1', primary.id);
    expect(component.confirmUnlink()).toBe(false);
    expect(component.successMessage()).toContain('blijft in je documenten bewaard');
  });

  it('shows archived assets read-only, including method-level mutation guards', () => {
    fixture.componentRef.setInput('isArchived', true);
    fixture.detectChanges();
    component.selectFile({ file: new File(['image'], 'new.jpg'), error: null });
    component.uploadImage();
    component.selectImage(gallery.id);
    component.makePrimary();
    component.confirmUnlink.set(true);
    component.unlinkImage();

    expect(imageService.addImage).not.toHaveBeenCalled();
    expect(imageService.makePrimary).not.toHaveBeenCalled();
    expect(imageService.unlinkImage).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('app-image-picker')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Herstel de bezitting');
  });

  it('does not enable uploads when the image metadata could not be loaded', () => {
    imageService.getImages.mockReturnValue(throwError(() => new Error('offline')));
    fixture.detectChanges();
    component.selectFile({ file: new File(['image'], 'new.jpg'), error: null });
    component.uploadImage();

    expect(component.loadError()).not.toBeNull();
    expect(imageService.addImage).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Opnieuw laden');
  });

  it('clears a pending file when archiving hides the picker, so restoring cannot upload it silently', () => {
    fixture.detectChanges();
    component.selectFile({ file: new File(['image'], 'pending.jpg'), error: null });

    fixture.componentRef.setInput('isArchived', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('isArchived', false);
    fixture.detectChanges();
    component.uploadImage();

    expect(component.selectedFile()).toBeNull();
    expect(imageService.addImage).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.upload-button')?.disabled).toBe(true);
  });
});
