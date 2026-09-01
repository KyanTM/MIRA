import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionCreate } from './subscription-create';

describe('SubscriptionCreate', () => {
  let fixture: ComponentFixture<SubscriptionCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SubscriptionCreate] }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionCreate);
    fixture.detectChanges();
  });

  it('can be created', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
