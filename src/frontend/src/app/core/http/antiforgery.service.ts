import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

interface AntiforgeryResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AntiforgeryService {
  private readonly httpBackend = inject(HttpBackend);
  private readonly rawHttp = new HttpClient(this.httpBackend);

  getToken(): Observable<string> {
    return this.rawHttp
      .get<AntiforgeryResponse>(`${environment.apiUrl}/security/antiforgery`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.token));
  }
}
