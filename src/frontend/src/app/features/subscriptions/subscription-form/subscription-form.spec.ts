import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionForm } from './subscription-form';

describe('SubscriptionForm', () => {
  let fixture: ComponentFixture<SubscriptionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SubscriptionForm] }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionForm);
    fixture.detectChanges();
  });

  it('can be created', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
