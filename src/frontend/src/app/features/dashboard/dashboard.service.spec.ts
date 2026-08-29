import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { DashboardResponse } from './models';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DashboardService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('requests the dashboard with the default query parameters', () => {
    const expectedResponse: DashboardResponse = {
      generatedAt: '2026-08-29T10:30:00+00:00',
      attentionThrough: '2026-09-28',
      counts: {
        assets: 2,
        documents: 1,
        warranties: 1,
        contracts: 0,
        subscriptions: 0,
      },
      recentItems: [
        {
          id: 'e96ee1af-839c-4373-8ca2-2ed982643383',
          name: 'Laptop',
          itemType: 'Asset',
          status: 'Active',
          createdAt: '2026-08-28T16:00:00+00:00',
        },
      ],
      attentionItems: [
        {
          itemId: '39900e85-a58f-4056-bc61-24902298c990',
          itemName: 'Laptopgarantie',
          itemType: 'Warranty',
          eventType: 'WarrantyExpires',
          dueOn: '2026-09-15',
        },
      ],
    };
    let actualResponse: DashboardResponse | undefined;

    service.getDashboard().subscribe((response) => {
      actualResponse = response;
    });

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${environment.apiUrl}/dashboard` &&
        candidate.params.get('horizonDays') === '30' &&
        candidate.params.get('recentItemCount') === '5',
    );

    expect(request.request.method).toBe('GET');

    request.flush(expectedResponse);

    expect(actualResponse).toEqual(expectedResponse);
  });

  it('uses caller-provided query parameters', () => {
    service.getDashboard(90, 12).subscribe();

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${environment.apiUrl}/dashboard` &&
        candidate.params.get('horizonDays') === '90' &&
        candidate.params.get('recentItemCount') === '12',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      generatedAt: '2026-08-29T10:30:00+00:00',
      attentionThrough: '2026-11-27',
      counts: {
        assets: 0,
        documents: 0,
        warranties: 0,
        contracts: 0,
        subscriptions: 0,
      },
      recentItems: [],
      attentionItems: [],
    } satisfies DashboardResponse);
  });
});
