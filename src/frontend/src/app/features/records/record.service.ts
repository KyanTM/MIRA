import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ArchiveRecord, FieldValue, RecordKind } from './record-config';

@Injectable({ providedIn: 'root' })
export class RecordService {
  private readonly http = inject(HttpClient);
  private url(kind: string, id?: string) {
    return `${environment.apiUrl}/${kind}${id ? '/' + encodeURIComponent(id) : ''}`;
  }
  list(kind: string, includeArchived = false, itemId?: string) {
    return this.http.get<ArchiveRecord[]>(this.url(kind), {
      params: {
        includeArchived,
        ...(itemId ? { [kind === 'warranties' ? 'assetId' : 'itemId']: itemId } : {}),
      },
    });
  }
  get(kind: RecordKind, id: string) {
    return this.http.get<ArchiveRecord>(this.url(kind, id));
  }
  save(kind: RecordKind, id: string | null, body: Record<string, FieldValue> | FormData) {
    return id
      ? this.http.put<ArchiveRecord>(this.url(kind, id), body)
      : this.http.post<ArchiveRecord>(this.url(kind), body);
  }
  archive(kind: RecordKind, id: string, restore: boolean) {
    return this.http.patch<ArchiveRecord>(
      `${this.url(kind, id)}/${restore ? 'restore' : 'archive'}`,
      null,
    );
  }
  download(id: string) {
    return this.http.get(`${this.url('documents', id)}/download`, { responseType: 'blob' });
  }
  link(id: string, itemId: string) {
    return this.http.put(`${this.url('documents', id)}/links/${encodeURIComponent(itemId)}`, {
      role: 'Attachment',
    });
  }
  unlink(id: string, itemId: string) {
    return this.http.delete(`${this.url('documents', id)}/links/${encodeURIComponent(itemId)}`);
  }
  delete(id: string) {
    return this.http.delete(this.url('documents', id));
  }
}
