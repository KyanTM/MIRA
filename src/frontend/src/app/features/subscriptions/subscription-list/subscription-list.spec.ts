import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionList } from './subscription-list';

describe('SubscriptionList', () => {
  let fixture: ComponentFixture<SubscriptionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SubscriptionList] }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionList);
    fixture.detectChanges();
  });

  it('can be created', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
