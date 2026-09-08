import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RecentItems } from './recent-items';

describe('RecentItems', () => {
  let fixture: ComponentFixture<RecentItems>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentItems],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentItems);
  });

  it('links subscriptions to their detail page', () => {
    fixture.componentRef.setInput('items', [
      {
        id: 'subscription-1',
        name: 'Internet',
        itemType: 'Subscription',
        status: 'Active',
        createdAt: '2026-09-04T10:00:00Z',
      },
    ]);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/subscriptions/subscription-1');
    expect(link.textContent).toContain('Internet');
  });
});
