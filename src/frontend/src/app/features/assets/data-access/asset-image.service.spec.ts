import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { DocumentDetail, DocumentLink, DocumentSummary } from '../image-models';
import { AssetImageService } from './asset-image.service';

describe('AssetImageService', () => {
  let service: AssetImageService;
  let httpTesting: HttpTestingController;

  const assetId = '9c0ccedf-f102-429c-b9b5-058494883b75';
  const documentsUrl = `${environment.apiUrl}/documents`;
  const listUrl = `${documentsUrl}?itemId=${assetId}&includeArchived=true`;
  const uploadedFile = new File(['image bytes'], 'laptop.png', { type: 'image/png' });

  function summary(id: string, overrides: Partial<DocumentSummary> = {}): DocumentSummary {
    return {
      id,
      name: `Afbeelding ${id}`,
      originalFileName: 'laptop.png',
      documentType: 'Image',
      mimeType: 'image/png',
      fileSizeBytes: 11,
      issuedOn: null,
      expiresOn: null,
      issuer: null,
      status: 'Active',
      createdAt: '2026-08-31T12:00:00+00:00',
      ...overrides,
    };
  }

  function link(role: string): DocumentLink {
    return {
      itemId: assetId,
      itemName: 'Laptop',
      itemType: 'Asset',
      role,
      linkedAt: '2026-08-31T12:00:00+00:00',
    };
  }

  function detail(
    id: string,
    role = 'GalleryImage',
    overrides: Partial<DocumentDetail> = {},
  ): DocumentDetail {
    return {
      ...summary(id),
      description: null,
      checksum: 'test-checksum',
      updatedAt: null,
      archivedAt: null,
      links: [link(role)],
      ...overrides,
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssetImageService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AssetImageService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('includes archived links and sorts primary first without depending on response timing', async () => {
    const resultPromise = firstValueFrom(service.getImages(assetId));

    const listRequest = httpTesting.expectOne(listUrl);
    expect(listRequest.request.method).toBe('GET');
    expect(listRequest.request.params.get('itemId')).toBe(assetId);
    expect(listRequest.request.params.get('includeArchived')).toBe('true');
    listRequest.flush([summary('first'), summary('primary'), summary('last')]);

    httpTesting.expectOne(`${documentsUrl}/last`).flush(detail('last'));
    httpTesting.expectOne(`${documentsUrl}/primary`).flush(
      detail('primary', 'PrimaryImage', {
        status: 'Archived',
        archivedAt: '2026-08-31T13:00:00+00:00',
      }),
    );
    httpTesting.expectOne(`${documentsUrl}/first`).flush(detail('first'));

    expect(await resultPromise).toEqual([
      {
        id: 'primary',
        name: 'Afbeelding primary',
        originalFileName: 'laptop.png',
        mimeType: 'image/png',
        fileSizeBytes: 11,
        status: 'Archived',
        role: 'PrimaryImage',
      },
      expect.objectContaining({ id: 'first', role: 'GalleryImage' }),
      expect.objectContaining({ id: 'last', role: 'GalleryImage' }),
    ]);
  });

  it('returns only supported raster files linked to this asset with an image role', async () => {
    const resultPromise = firstValueFrom(service.getImages(assetId));

    httpTesting
      .expectOne(listUrl)
      .flush([
        summary('jpeg', { mimeType: 'image/jpeg', documentType: 'Other' }),
        summary('webp', { mimeType: 'image/webp' }),
        summary('attachment'),
        summary('other-asset'),
        summary('pdf', { mimeType: 'application/pdf' }),
        summary('svg', { mimeType: 'image/svg+xml' }),
      ]);

    httpTesting.expectOne(`${documentsUrl}/jpeg`).flush(
      detail('jpeg', 'GalleryImage', {
        mimeType: 'image/jpeg',
        documentType: 'Other',
        links: [{ ...link('PrimaryImage'), itemId: 'another-asset' }, link('GalleryImage')],
      }),
    );
    httpTesting
      .expectOne(`${documentsUrl}/webp`)
      .flush(detail('webp', 'PrimaryImage', { mimeType: 'image/webp' }));
    httpTesting.expectOne(`${documentsUrl}/attachment`).flush(detail('attachment', 'Attachment'));
    httpTesting.expectOne(`${documentsUrl}/other-asset`).flush(
      detail('other-asset', 'PrimaryImage', {
        links: [{ ...link('PrimaryImage'), itemId: 'another-asset' }],
      }),
    );
    httpTesting.expectNone(`${documentsUrl}/pdf`);
    httpTesting.expectNone(`${documentsUrl}/svg`);

    expect(await resultPromise).toEqual([
      expect.objectContaining({ id: 'webp', role: 'PrimaryImage' }),
      expect.objectContaining({ id: 'jpeg', role: 'GalleryImage' }),
    ]);
  });

  it('emits an empty list when an asset has no image documents', async () => {
    const resultPromise = firstValueFrom(service.getImages(assetId));
    httpTesting.expectOne(listUrl).flush([]);

    expect(await resultPromise).toEqual([]);
  });

  it('fetches at most four document details concurrently and keeps list order', async () => {
    const resultPromise = firstValueFrom(service.getImages(assetId));
    const documents = Array.from({ length: 6 }, (_, index) => summary(`image-${index}`));
    httpTesting.expectOne(listUrl).flush(documents);

    const initialRequests = httpTesting.match((request) =>
      request.url.startsWith(`${documentsUrl}/image-`),
    );
    expect(initialRequests).toHaveLength(4);
    httpTesting.expectNone(`${documentsUrl}/image-4`);
    httpTesting.expectNone(`${documentsUrl}/image-5`);

    initialRequests[2].flush(detail('image-2'));
    const fifthRequest = httpTesting.expectOne(`${documentsUrl}/image-4`);
    httpTesting.expectNone(`${documentsUrl}/image-5`);
    fifthRequest.flush(detail('image-4'));
    httpTesting.expectOne(`${documentsUrl}/image-5`).flush(detail('image-5'));
    initialRequests[3].flush(detail('image-3'));
    initialRequests[0].flush(detail('image-0'));
    initialRequests[1].flush(detail('image-1'));

    expect((await resultPromise).map((image) => image.id)).toEqual(
      documents.map((document) => document.id),
    );
  });

  it('downloads private image content as a Blob through HttpClient', async () => {
    const resultPromise = firstValueFrom(service.getImageContent('image-id'));
    const imageBlob = new Blob(['image bytes'], { type: 'image/png' });

    const request = httpTesting.expectOne(`${documentsUrl}/image-id/download`);
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(imageBlob);

    expect(await resultPromise).toBe(imageBlob);
  });

  it('uploads the exact multipart fields without overriding the browser Content-Type', async () => {
    const resultPromise = firstValueFrom(
      service.uploadImage(assetId, uploadedFile, 'GalleryImage'),
    );

    const request = httpTesting.expectOne(documentsUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has('Content-Type')).toBe(false);
    expect(request.request.body).toBeInstanceOf(FormData);
    const formData = request.request.body as FormData;
    expect(Array.from(formData.keys())).toEqual(['File', 'DocumentType', 'ItemId', 'Role']);
    expect(formData.get('File')).toBe(uploadedFile);
    expect(formData.get('DocumentType')).toBe('Image');
    expect(formData.get('ItemId')).toBe(assetId);
    expect(formData.get('Role')).toBe('GalleryImage');
    request.flush(detail('uploaded', 'GalleryImage'));

    expect(await resultPromise).toEqual({
      id: 'uploaded',
      name: 'Afbeelding uploaded',
      originalFileName: 'laptop.png',
      mimeType: 'image/png',
      fileSizeBytes: 11,
      status: 'Active',
      role: 'GalleryImage',
    });
  });

  it('automatically makes the first uploaded image the primary image', async () => {
    const resultPromise = firstValueFrom(service.addImage(assetId, uploadedFile));
    httpTesting.expectOne(listUrl).flush([]);

    const uploadRequest = httpTesting.expectOne(documentsUrl);
    expect((uploadRequest.request.body as FormData).get('Role')).toBe('PrimaryImage');
    uploadRequest.flush(detail('new-image', 'PrimaryImage'));

    expect((await resultPromise).role).toBe('PrimaryImage');
  });

  it.each(['Active', 'Archived'])(
    'keeps an existing %s primary-image slot occupied',
    async (status) => {
      const resultPromise = firstValueFrom(service.addImage(assetId, uploadedFile));
      httpTesting.expectOne(listUrl).flush([summary('existing', { status })]);
      httpTesting
        .expectOne(`${documentsUrl}/existing`)
        .flush(detail('existing', 'PrimaryImage', { status }));

      const uploadRequest = httpTesting.expectOne(documentsUrl);
      expect((uploadRequest.request.body as FormData).get('Role')).toBe('GalleryImage');
      uploadRequest.flush(detail('new-image', 'GalleryImage'));

      expect((await resultPromise).role).toBe('GalleryImage');
    },
  );

  it('uses the primary role when only gallery links remain', async () => {
    const resultPromise = firstValueFrom(service.addImage(assetId, uploadedFile));
    httpTesting.expectOne(listUrl).flush([summary('existing')]);
    httpTesting.expectOne(`${documentsUrl}/existing`).flush(detail('existing', 'GalleryImage'));

    const uploadRequest = httpTesting.expectOne(documentsUrl);
    expect((uploadRequest.request.body as FormData).get('Role')).toBe('PrimaryImage');
    uploadRequest.flush(detail('new-image', 'PrimaryImage'));

    expect((await resultPromise).role).toBe('PrimaryImage');
  });

  it('only deletes the asset link, never the stored document', async () => {
    const resultPromise = firstValueFrom(service.unlinkImage(assetId, 'image-id'));

    const request = httpTesting.expectOne(`${documentsUrl}/image-id/links/${assetId}`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    httpTesting.expectNone(`${documentsUrl}/image-id`);
    request.flush(null, { status: 204, statusText: 'No Content' });

    await resultPromise;
  });

  it('demotes the previous primary before promoting a new one', async () => {
    const resultPromise = firstValueFrom(service.makePrimary(assetId, 'next', 'previous'));

    const demoteRequest = httpTesting.expectOne(`${documentsUrl}/previous/links/${assetId}`);
    expect(demoteRequest.request.method).toBe('PUT');
    expect(demoteRequest.request.body).toEqual({ role: 'GalleryImage' });
    httpTesting.expectNone(`${documentsUrl}/next/links/${assetId}`);
    demoteRequest.flush(link('GalleryImage'));

    const promoteRequest = httpTesting.expectOne(`${documentsUrl}/next/links/${assetId}`);
    expect(promoteRequest.request.method).toBe('PUT');
    expect(promoteRequest.request.body).toEqual({ role: 'PrimaryImage' });
    promoteRequest.flush(link('PrimaryImage'));

    expect(await resultPromise).toBeUndefined();
  });

  it('promotes directly when no previous primary image exists', async () => {
    const resultPromise = firstValueFrom(service.makePrimary(assetId, 'next', null));

    const request = httpTesting.expectOne(`${documentsUrl}/next/links/${assetId}`);
    expect(request.request.body).toEqual({ role: 'PrimaryImage' });
    request.flush(link('PrimaryImage'));

    expect(await resultPromise).toBeUndefined();
  });

  it('makes no request when the target is already the primary image', async () => {
    expect(await firstValueFrom(service.makePrimary(assetId, 'same', 'same'))).toBeUndefined();
    httpTesting.expectNone((request) => request.url.startsWith(documentsUrl));
  });

  it('does not promote or roll back when demoting the old image fails', async () => {
    const resultPromise = firstValueFrom(service.makePrimary(assetId, 'next', 'previous')).catch(
      (error: unknown) => error,
    );

    httpTesting
      .expectOne(`${documentsUrl}/previous/links/${assetId}`)
      .flush({ title: 'Het document is gearchiveerd.' }, { status: 409, statusText: 'Conflict' });
    httpTesting.expectNone(`${documentsUrl}/next/links/${assetId}`);
    httpTesting.expectNone(`${documentsUrl}/previous/links/${assetId}`);

    expect(await resultPromise).toMatchObject({ status: 409 });
  });

  it('restores the previous primary after failed promotion and reports the original error', async () => {
    const resultPromise = firstValueFrom(service.makePrimary(assetId, 'next', 'previous')).catch(
      (error: unknown) => error,
    );

    httpTesting.expectOne(`${documentsUrl}/previous/links/${assetId}`).flush(link('GalleryImage'));
    const originalError = { title: 'De nieuwe afbeelding bestaat niet meer.' };
    httpTesting.expectOne(`${documentsUrl}/next/links/${assetId}`).flush(originalError, {
      status: 404,
      statusText: 'Not Found',
    });

    const rollbackRequest = httpTesting.expectOne(`${documentsUrl}/previous/links/${assetId}`);
    expect(rollbackRequest.request.method).toBe('PUT');
    expect(rollbackRequest.request.body).toEqual({ role: 'PrimaryImage' });
    rollbackRequest.flush(link('PrimaryImage'));

    expect(await resultPromise).toMatchObject({ status: 404, error: originalError });
  });

  it('preserves the promotion error even if restoring the previous primary also fails', async () => {
    const resultPromise = firstValueFrom(service.makePrimary(assetId, 'next', 'previous')).catch(
      (error: unknown) => error,
    );

    httpTesting.expectOne(`${documentsUrl}/previous/links/${assetId}`).flush(link('GalleryImage'));
    const originalError = { title: 'De nieuwe afbeelding bestaat niet meer.' };
    httpTesting.expectOne(`${documentsUrl}/next/links/${assetId}`).flush(originalError, {
      status: 404,
      statusText: 'Not Found',
    });
    httpTesting
      .expectOne(`${documentsUrl}/previous/links/${assetId}`)
      .flush(
        { title: 'Er bestaat al een hoofdafbeelding.' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(await resultPromise).toMatchObject({ status: 404, error: originalError });
  });
});
