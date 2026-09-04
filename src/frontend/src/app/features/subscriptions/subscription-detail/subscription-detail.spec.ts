import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { SubscriptionDetailPage } from './subscription-detail';

describe('SubscriptionDetailPage', () => {
  let fixture: ComponentFixture<SubscriptionDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionDetailPage],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionDetailPage);
    fixture.detectChanges();
  });

  it('can be created', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
