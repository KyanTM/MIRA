import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DashboardSummary } from './dashboard-summary';

describe('DashboardSummary', () => {
  let fixture: ComponentFixture<DashboardSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSummary],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardSummary);
    fixture.componentRef.setInput('counts', {
      assets: 2,
      documents: 1,
      warranties: 0,
      contracts: 0,
      subscriptions: 3,
    });
    fixture.detectChanges();
  });

  it('links implemented dashboard categories to their overviews', () => {
    const links = Array.from<HTMLAnchorElement>(fixture.nativeElement.querySelectorAll('a'));

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/assets',
      '/subscriptions',
    ]);
  });
});
