import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionEdit } from './subscription-edit';

describe('SubscriptionEdit', () => {
  let fixture: ComponentFixture<SubscriptionEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SubscriptionEdit] }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionEdit);
    fixture.detectChanges();
  });

  it('can be created', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
