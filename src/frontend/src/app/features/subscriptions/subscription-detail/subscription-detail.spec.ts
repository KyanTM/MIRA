import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionDetail } from './subscription-detail';

describe('SubscriptionDetail', () => {
  let fixture: ComponentFixture<SubscriptionDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SubscriptionDetail] }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionDetail);
    fixture.detectChanges();
  });

  it('can be created', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
