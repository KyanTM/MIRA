import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AntiforgeryService } from './antiforgery.service';

describe('AntiforgeryService', () => {
  let antiforgeryService: AntiforgeryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    antiforgeryService = TestBed.inject(AntiforgeryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('gets an antiforgery token with credentials', async () => {
    const resultPromise = firstValueFrom(antiforgeryService.getToken());

    const request = httpTesting.expectOne(`${environment.apiUrl}/security/antiforgery`);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ token: 'test-antiforgery-token' });

    expect(await resultPromise).toBe('test-antiforgery-token');
  });
});
