import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Dashboard } from './dashboard';
import { DashboardService } from './dashboard.service';
import { DashboardResponse } from './models';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let getDashboard: ReturnType<typeof vi.fn>;

  const response: DashboardResponse = {
    generatedAt: '2026-08-29T10:00:00Z',
    attentionThrough: '2026-09-28',
    counts: {
      assets: 1,
      documents: 0,
      warranties: 0,
      contracts: 0,
      subscriptions: 0,
    },
    recentItems: [
      {
        id: 'asset-1',
        name: 'Laptop',
        itemType: 'Asset',
        status: 'Active',
        createdAt: '2026-08-28T14:00:00Z',
      },
    ],
    attentionItems: [],
  };

  beforeEach(async () => {
    getDashboard = vi.fn(() => of(response));

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: { getDashboard },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads and displays live dashboard data', () => {
    expect(component).toBeTruthy();
    expect(getDashboard).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Laptop');
    expect(fixture.nativeElement.textContent).toContain('Geen aandachtspunten');
  });

  it('shows a retryable error state when loading fails', async () => {
    getDashboard.mockReturnValue(throwError(() => new Error('offline')));

    component.loadDashboard();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Je overzicht kon niet worden geladen');
    expect(fixture.nativeElement.textContent).toContain('Opnieuw proberen');
  });
});
