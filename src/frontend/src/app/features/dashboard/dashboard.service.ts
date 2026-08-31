import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DashboardResponse } from './models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly dashboardUrl = `${environment.apiUrl}/dashboard`;

  getDashboard(horizonDays = 30, recentItemCount = 5): Observable<DashboardResponse> {
    const params = new HttpParams()
      .set('horizonDays', horizonDays)
      .set('recentItemCount', recentItemCount);

    return this.http.get<DashboardResponse>(this.dashboardUrl, { params });
  }
}
