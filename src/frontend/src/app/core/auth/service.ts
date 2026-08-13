import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap, tap } from 'rxjs';

import { AntiforgeryResponse, AuthenticatedUser, LoginRequest, RegisterRequest } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:7082/api';

  private antiforgeryToken: string | null = null;

  login(request: LoginRequest): Observable<AuthenticatedUser> {
    return this.refreshAntiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<AuthenticatedUser>(`${this.apiUrl}/auth/login`, request, {
          withCredentials: true,
          headers: {
            'X-XSRF-TOKEN': token,
          },
        }),
      ),
      switchMap((user) => this.refreshAntiforgeryToken().pipe(map(() => user))),
    );
  }

  private refreshAntiforgeryToken(): Observable<string> {
    return this.http
      .get<AntiforgeryResponse>(`${this.apiUrl}/security/antiforgery`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.token),
        tap((token) => {
          this.antiforgeryToken = token;
        }),
      );
  }

  register(request: RegisterRequest): Observable<AuthenticatedUser> {
    return this.refreshAntiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<AuthenticatedUser>(`${this.apiUrl}/auth/register`, request, {
          withCredentials: true,
          headers: {
            'X-XSRF-TOKEN': token,
          },
        }),
      ),

      switchMap((user) => this.refreshAntiforgeryToken().pipe(map(() => user))),
    );
  }
}
