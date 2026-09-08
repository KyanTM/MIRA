import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { RecordService } from './record.service';

describe('RecordService', () => {
  let service: RecordService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecordService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('loads warranties scoped to the asset and includes archives only when requested', () => {
    service.list('warranties', true, 'asset-1').subscribe();
    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/warranties`);
    expect(request.request.params.get('assetId')).toBe('asset-1');
    expect(request.request.params.get('includeArchived')).toBe('true');
    request.flush([]);
  });
  it('uses PUT for edits and PATCH for restoring records', () => {
    service.save('contracts', 'contract-1', { name: 'Internet' }).subscribe();
    const update = http.expectOne(`${environment.apiUrl}/contracts/contract-1`);
    expect(update.request.method).toBe('PUT');
    update.flush({});
    service.archive('contracts', 'contract-1', true).subscribe();
    const restore = http.expectOne(`${environment.apiUrl}/contracts/contract-1/restore`);
    expect(restore.request.method).toBe('PATCH');
    restore.flush({});
  });
  it('downloads through the protected API and links documents as attachments', () => {
    service.download('document-1').subscribe();
    const download = http.expectOne(`${environment.apiUrl}/documents/document-1/download`);
    expect(download.request.responseType).toBe('blob');
    download.flush(new Blob(['file']));
    service.link('document-1', 'contract-1').subscribe();
    const link = http.expectOne(`${environment.apiUrl}/documents/document-1/links/contract-1`);
    expect(link.request.method).toBe('PUT');
    expect(link.request.body).toEqual({ role: 'Attachment' });
    link.flush({});
  });
});
