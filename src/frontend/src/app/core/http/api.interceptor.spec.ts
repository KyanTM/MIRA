import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('adds credentials but no antiforgery header to an API GET', async () => {
    const resultPromise = firstValueFrom(
      http.get<unknown[]>(`${environment.apiUrl}/assets`),
    );

    const request = httpTesting.expectOne(`${environment.apiUrl}/assets`);
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    request.flush([]);

    expect(await resultPromise).toEqual([]);
  });

  it('adds credentials and an antiforgery header to an API POST', async () => {
    const resultPromise = firstValueFrom(
      http.post(`${environment.apiUrl}/assets`, { name: 'Laptop' }),
    );

    const tokenRequest = httpTesting.expectOne(
      `${environment.apiUrl}/security/antiforgery`,
    );
    expect(tokenRequest.request.method).toBe('GET');
    expect(tokenRequest.request.withCredentials).toBe(true);
    tokenRequest.flush({ token: 'test-antiforgery-token' });

    const apiRequest = httpTesting.expectOne(`${environment.apiUrl}/assets`);
    expect(apiRequest.request.method).toBe('POST');
    expect(apiRequest.request.withCredentials).toBe(true);
    expect(apiRequest.request.headers.get('X-XSRF-TOKEN')).toBe(
      'test-antiforgery-token',
    );
    apiRequest.flush({ id: 'asset-id', name: 'Laptop' });

    expect(await resultPromise).toEqual({ id: 'asset-id', name: 'Laptop' });
  });

  it('does not add MIRA credentials or tokens to an external request', async () => {
    const externalUrl = 'https://example.com/data';
    const resultPromise = firstValueFrom(http.get(externalUrl));

    const request = httpTesting.expectOne(externalUrl);
    expect(request.request.withCredentials).toBe(false);
    expect(request.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    httpTesting.expectNone(`${environment.apiUrl}/security/antiforgery`);
    request.flush({ ok: true });

    expect(await resultPromise).toEqual({ ok: true });
  });
});
