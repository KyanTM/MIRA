import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  catchError,
  from,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  throwError,
  toArray,
} from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AssetImage,
  AssetImageRole,
  DocumentDetail,
  DocumentLink,
  DocumentSummary,
} from '../image-models';

@Injectable({
  providedIn: 'root',
})
export class AssetImageService {
  private readonly http = inject(HttpClient);
  private readonly documentsUrl = `${environment.apiUrl}/documents`;
  private readonly supportedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

  getImages(assetId: string): Observable<AssetImage[]> {
    // An archived document can still occupy the asset's primary-image slot.
    const params = new HttpParams().set('itemId', assetId).set('includeArchived', true);

    return this.http.get<DocumentSummary[]>(this.documentsUrl, { params }).pipe(
      switchMap((documents) =>
        from(documents.filter((document) => this.supportedMimeTypes.has(document.mimeType))).pipe(
          // The list DTO has no link role, so retrieve details with bounded concurrency.
          mergeMap(
            (document, index) =>
              this.http
                .get<DocumentDetail>(`${this.documentsUrl}/${document.id}`)
                .pipe(map((detail) => ({ image: this.toAssetImage(detail, assetId), index }))),
            4,
          ),
          toArray(),
          map((results) =>
            results
              .filter(
                (result): result is { image: AssetImage; index: number } => result.image !== null,
              )
              .sort(
                (left, right) =>
                  Number(right.image.role === 'PrimaryImage') -
                    Number(left.image.role === 'PrimaryImage') || left.index - right.index,
              )
              .map((result) => result.image),
          ),
        ),
      ),
    );
  }

  getImageContent(documentId: string): Observable<Blob> {
    // HttpClient uses the existing auth interceptor; no public file URL is exposed.
    return this.http.get(`${this.documentsUrl}/${documentId}/download`, { responseType: 'blob' });
  }

  uploadImage(assetId: string, file: File, role: AssetImageRole): Observable<AssetImage> {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('DocumentType', 'Image');
    formData.append('ItemId', assetId);
    formData.append('Role', role);

    // The browser sets Content-Type, including the multipart boundary.
    return this.http.post<DocumentDetail>(this.documentsUrl, formData).pipe(
      map((document) => ({
        id: document.id,
        name: document.name,
        originalFileName: document.originalFileName,
        mimeType: document.mimeType,
        fileSizeBytes: document.fileSizeBytes,
        status: document.status,
        role,
      })),
    );
  }

  addImage(assetId: string, file: File): Observable<AssetImage> {
    return this.getImages(assetId).pipe(
      switchMap((images) => {
        const role = images.some((image) => image.role === 'PrimaryImage')
          ? 'GalleryImage'
          : 'PrimaryImage';

        return this.uploadImage(assetId, file, role);
      }),
    );
  }

  unlinkImage(assetId: string, documentId: string): Observable<void> {
    // Only remove this relationship: the private document itself remains intact.
    return this.http.delete<void>(`${this.documentsUrl}/${documentId}/links/${assetId}`);
  }

  makePrimary(
    assetId: string,
    targetId: string,
    previousPrimaryId: string | null,
  ): Observable<void> {
    if (targetId === previousPrimaryId) {
      return of(undefined);
    }

    if (previousPrimaryId === null) {
      return this.setImageRole(assetId, targetId, 'PrimaryImage');
    }

    return this.setImageRole(assetId, previousPrimaryId, 'GalleryImage').pipe(
      switchMap(() =>
        this.setImageRole(assetId, targetId, 'PrimaryImage').pipe(
          catchError((promotionError: unknown) =>
            // The API allows one primary image. If promotion fails, try to restore it.
            this.setImageRole(assetId, previousPrimaryId, 'PrimaryImage').pipe(
              catchError(() => of(undefined)),
              switchMap(() => throwError(() => promotionError)),
            ),
          ),
        ),
      ),
    );
  }

  private setImageRole(
    assetId: string,
    documentId: string,
    role: AssetImageRole,
  ): Observable<void> {
    return this.http
      .put<DocumentLink>(`${this.documentsUrl}/${documentId}/links/${assetId}`, { role })
      .pipe(map(() => undefined));
  }

  private toAssetImage(document: DocumentDetail, assetId: string): AssetImage | null {
    const link = document.links.find((candidate) => candidate.itemId === assetId);

    if (!link || (link.role !== 'PrimaryImage' && link.role !== 'GalleryImage')) {
      return null;
    }

    return {
      id: document.id,
      name: document.name,
      originalFileName: document.originalFileName,
      mimeType: document.mimeType,
      fileSizeBytes: document.fileSizeBytes,
      status: document.status,
      role: link.role,
    };
  }
}
