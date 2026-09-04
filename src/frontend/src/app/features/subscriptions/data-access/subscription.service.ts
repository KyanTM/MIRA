import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly subscriptionsUrl = `${environment.apiUrl}/subscriptions`;

  // ===== JOUW CODE — leerstap 2 =====
  // Maak de methodes in deze volgorde:
  // 1. getSubscriptions(includeArchived)
  // 2. getSubscription(id)
  // 3. createSubscription(request)
  // 4. updateSubscription(id, request)
  // 5. archiveSubscription(id)
  // 6. restoreSubscription(id)
  //
  // Gebruik this.http en this.subscriptionsUrl hierboven.
  // Kijk telkens naar asset.service.ts, maar typ de methode zelf over
  // en vervang bewust de Asset-types door de juiste Subscription-types.
  // ===== EINDE JOUW CODE =====

}
