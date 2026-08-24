import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthenticatedUser,
  LoginRequest,
  RegisterRequest,
} from './models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly _currentUser =
    signal<AuthenticatedUser | null>(null);

  readonly currentUser = this._currentUser.asReadonly();

  login(request: LoginRequest): Observable<AuthenticatedUser> {
    return this.http
      .post<AuthenticatedUser>(
        `${this.apiUrl}/auth/login`,
        request,
      )
      .pipe(
        tap((user) => {
          this._currentUser.set(user);
        }),
      );
  }

  register(request: RegisterRequest): Observable<AuthenticatedUser> {
    return this.http
      .post<AuthenticatedUser>(
        `${this.apiUrl}/auth/register`,
        request,
      )
      .pipe(
        tap((user) => {
          this._currentUser.set(user);
        }),
      );
  }

  loadCurrentUser(): Observable<AuthenticatedUser> {
    return this.http
      .get<AuthenticatedUser>(`${this.apiUrl}/auth/me`)
      .pipe(
        tap((user) => {
          this._currentUser.set(user);
        }),
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/auth/logout`, null)
      .pipe(
        tap(() => {
          this._currentUser.set(null);
        }),
      );
  }
}