import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateSubscriptionRequest,
  SubscriptionDetail,
  SubscriptionSummary,
  UpdateSubscriptionRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly subscriptionsUrl = `${environment.apiUrl}/subscriptions`;

  getSubscriptions(includeArchived = false): Observable<SubscriptionSummary[]> {
    if (!includeArchived) {
      return this.http.get<SubscriptionSummary[]>(this.subscriptionsUrl);
    }

    const params = new HttpParams().set('includeArchived', true);

    return this.http.get<SubscriptionSummary[]>(this.subscriptionsUrl, { params });
  }

  getSubscription(id: string): Observable<SubscriptionDetail> {
    return this.http.get<SubscriptionDetail>(`${this.subscriptionsUrl}/${id}`);
  }

  createSubscription(request: CreateSubscriptionRequest): Observable<SubscriptionDetail> {
    return this.http.post<SubscriptionDetail>(this.subscriptionsUrl, request);
  }

  updateSubscription(
    id: string,
    request: UpdateSubscriptionRequest,
  ): Observable<SubscriptionDetail> {
    return this.http.put<SubscriptionDetail>(`${this.subscriptionsUrl}/${id}`, request);
  }

  archiveSubscription(id: string): Observable<SubscriptionDetail> {
    return this.http.patch<SubscriptionDetail>(`${this.subscriptionsUrl}/${id}/archive`, null);
  }

  restoreSubscription(id: string): Observable<SubscriptionDetail> {
    return this.http.patch<SubscriptionDetail>(`${this.subscriptionsUrl}/${id}/restore`, null);
  }
}
