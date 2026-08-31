import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagePicker, ImageSelection } from './image-picker';

describe('ImagePicker', () => {
  let fixture: ComponentFixture<ImagePicker>;
  let component: ImagePicker;
  let selections: ImageSelection[];
  let createObjectUrl: ReturnType<typeof vi.fn<(blob: Blob | MediaSource) => string>>;
  let revokeObjectUrl: ReturnType<typeof vi.fn<(url: string) => void>>;

  beforeEach(async () => {
    let nextUrl = 0;
    createObjectUrl = vi.fn(() => `blob:mira-preview-${++nextUrl}`);
    revokeObjectUrl = vi.fn();
    const NativeUrl = URL;
    vi.stubGlobal(
      'URL',
      class extends NativeUrl {
        static override createObjectURL = createObjectUrl;
        static override revokeObjectURL = revokeObjectUrl;
      },
    );

    await TestBed.configureTestingModule({ imports: [ImagePicker] }).compileComponents();
    fixture = TestBed.createComponent(ImagePicker);
    component = fixture.componentInstance;
    selections = [];
    component.selectionChanged.subscribe((selection) => selections.push(selection));
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  function chooseFile(file: File | null): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    Object.defineProperty(input, 'files', { configurable: true, value: file ? [file] : [] });
    Object.defineProperty(input, 'value', {
      configurable: true,
      writable: true,
      value: file ? `C:\\fakepath\\${file.name}` : '',
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  it('labels the native input and shows a local preview for a valid image', () => {
    fixture.componentRef.setInput('inputId', 'new-asset-photo');
    fixture.componentRef.setInput('label', 'Foto van de bezitting');
    fixture.detectChanges();
    const file = new File(['image'], 'laptop.png', { type: 'image/png' });

    chooseFile(file);

    expect(selections.at(-1)).toEqual({ file, error: null });
    expect(createObjectUrl).toHaveBeenCalledWith(file);
    expect(fixture.nativeElement.querySelector('label').htmlFor).toBe('new-asset-photo');
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(
      'blob:mira-preview-1',
    );
    expect(fixture.nativeElement.querySelector('img').alt).toBe('Voorbeeld van laptop.png');
    expect(fixture.nativeElement.querySelector('figcaption').textContent).toContain('laptop.png');
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-invalid')).toBe('false');
  });

  it.each([
    ['photo.JPG', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['photo.png', 'image/png'],
    ['photo.webp', 'image/webp'],
    ['photo.png', ''],
  ])('accepts a supported extension and matching or empty MIME: %s (%s)', (name, type) => {
    const file = new File(['image'], name, { type });

    chooseFile(file);

    expect(selections.at(-1)).toEqual({ file, error: null });
  });

  it.each([
    ['photo.svg', 'image/svg+xml'],
    ['photo.gif', 'image/gif'],
    ['photo.heic', 'image/heic'],
    ['photo.png', 'image/jpeg'],
    ['photo.jpg', 'text/plain'],
    ['photo', 'image/png'],
  ])('rejects unsupported or mismatched file types: %s (%s)', (name, type) => {
    chooseFile(new File(['image'], name, { type }));

    expect(selections.at(-1)?.file).toBeNull();
    expect(selections.at(-1)?.error).toContain('JPG-, PNG- of WebP-afbeelding');
    expect(createObjectUrl).not.toHaveBeenCalled();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('asset-image-hint asset-image-error');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('extensie');
  });

  it('rejects an empty image', () => {
    chooseFile(new File([], 'empty.png', { type: 'image/png' }));

    expect(selections.at(-1)?.error).toContain('bestand is leeg');
    expect(createObjectUrl).not.toHaveBeenCalled();
  });

  it('rejects images over 20 MiB but accepts the exact limit', () => {
    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { configurable: true, value: 20 * 1024 * 1024 + 1 });

    chooseFile(file);

    expect(selections.at(-1)?.error).toContain('maximaal 20 MB');
    expect(createObjectUrl).not.toHaveBeenCalled();

    Object.defineProperty(file, 'size', { configurable: true, value: 20 * 1024 * 1024 });
    chooseFile(file);

    expect(selections.at(-1)).toEqual({ file, error: null });
    expect(fixture.nativeElement.querySelector('.file-size').textContent).toBe('20 MB');
  });

  it('revokes the previous preview when another image is selected', () => {
    chooseFile(new File(['first'], 'first.png', { type: 'image/png' }));
    const previousImage = fixture.nativeElement.querySelector('img');
    chooseFile(new File(['second'], 'second.png', { type: 'image/png' }));

    expect(revokeObjectUrl).toHaveBeenCalledExactlyOnceWith('blob:mira-preview-1');
    expect(fixture.nativeElement.querySelector('img')).not.toBe(previousImage);
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(
      'blob:mira-preview-2',
    );
  });

  it('clears the pending selection and returns focus to the file input', () => {
    chooseFile(new File(['image'], 'photo.png', { type: 'image/png' }));

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(selections.at(-1)).toEqual({ file: null, error: null });
    expect(revokeObjectUrl).toHaveBeenCalledExactlyOnceWith('blob:mira-preview-1');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('input').value).toBe('');
    expect(document.activeElement?.id).toBe('asset-image');
  });

  it('allows clearing an invalid optional selection', () => {
    chooseFile(new File(['image'], 'photo.svg', { type: 'image/svg+xml' }));

    component.clearSelection();
    fixture.detectChanges();

    expect(selections.at(-1)).toEqual({ file: null, error: null });
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('resets and revokes the preview when the parent changes resetToken, even while disabled', () => {
    chooseFile(new File(['image'], 'photo.png', { type: 'image/png' }));

    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();

    expect(selections.at(-1)).toEqual({ file: null, error: null });
    expect(revokeObjectUrl).toHaveBeenCalledExactlyOnceWith('blob:mira-preview-1');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('input').value).toBe('');
  });

  it('revokes the active preview when the component is destroyed', () => {
    chooseFile(new File(['image'], 'photo.png', { type: 'image/png' }));

    fixture.destroy();

    expect(revokeObjectUrl).toHaveBeenCalledExactlyOnceWith('blob:mira-preview-1');
  });

  it('disables selection and clearing without discarding the current file', () => {
    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    chooseFile(file);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    chooseFile(new File(['other'], 'other.png', { type: 'image/png' }));
    component.clearSelection();
    fixture.detectChanges();

    expect(selections).toEqual([{ file, error: null }]);
    expect(fixture.nativeElement.querySelector('input').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    expect(revokeObjectUrl).not.toHaveBeenCalled();
  });

  it('reports preview decode failure and clears the unusable image', () => {
    chooseFile(new File(['corrupt'], 'photo.png', { type: 'image/png' }));

    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(selections.at(-1)?.file).toBeNull();
    expect(selections.at(-1)?.error).toContain('kan niet worden geopend');
    expect(revokeObjectUrl).toHaveBeenCalledExactlyOnceWith('blob:mira-preview-1');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('input').value).toBe('');
  });

  it('ignores a late preview error for a previous selection', () => {
    chooseFile(new File(['first'], 'first.png', { type: 'image/png' }));
    const file = new File(['second'], 'second.png', { type: 'image/png' });
    chooseFile(file);

    component.onPreviewError('blob:mira-preview-1');
    fixture.detectChanges();

    expect(selections.at(-1)).toEqual({ file, error: null });
    expect(selections).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(
      'blob:mira-preview-2',
    );
  });

  it('keeps the current selection when the file dialog is cancelled', () => {
    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    chooseFile(file);

    chooseFile(null);

    expect(selections).toEqual([{ file, error: null }]);
    expect(revokeObjectUrl).not.toHaveBeenCalled();
  });

  it('clears a previous preview when the replacement is invalid', () => {
    chooseFile(new File(['image'], 'photo.png', { type: 'image/png' }));

    chooseFile(new File(['image'], 'photo.svg', { type: 'image/svg+xml' }));

    expect(revokeObjectUrl).toHaveBeenCalledExactlyOnceWith('blob:mira-preview-1');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(selections.at(-1)?.file).toBeNull();
  });

  it('reports failure to create a local preview without throwing', () => {
    createObjectUrl.mockImplementationOnce(() => {
      throw new Error('Preview unavailable');
    });

    chooseFile(new File(['image'], 'photo.png', { type: 'image/png' }));

    expect(selections.at(-1)?.file).toBeNull();
    expect(selections.at(-1)?.error).toContain('voorbeeld kon niet worden gemaakt');
    expect(fixture.nativeElement.querySelector('input').value).toBe('');
  });
});
