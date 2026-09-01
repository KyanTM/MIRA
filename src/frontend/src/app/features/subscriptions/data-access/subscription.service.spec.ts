import { TestBed } from '@angular/core/testing';

import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  it('can be created', () => {
    const service = TestBed.inject(SubscriptionService);

    expect(service).toBeTruthy();
  });
});
