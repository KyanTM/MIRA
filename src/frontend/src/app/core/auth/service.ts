import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, of, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthenticatedUser, AuthStatus, LoginRequest, RegisterRequest } from './models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly _currentUser = signal<AuthenticatedUser | null>(null);

  private readonly _authStatus = signal<AuthStatus>('checking');

  private currentUserRequest$: Observable<AuthenticatedUser> | null = null;

  readonly currentUser = this._currentUser.asReadonly();
  readonly authStatus = this._authStatus.asReadonly();

  login(request: LoginRequest): Observable<AuthenticatedUser> {
    return this.http.post<AuthenticatedUser>(`${this.apiUrl}/auth/login`, request).pipe(
      tap((user) => {
        this.setAuthenticated(user);
      }),
    );
  }

  register(request: RegisterRequest): Observable<AuthenticatedUser> {
    return this.http.post<AuthenticatedUser>(`${this.apiUrl}/auth/register`, request).pipe(
      tap((user) => {
        this.setAuthenticated(user);
      }),
    );
  }

  loadCurrentUser(): Observable<AuthenticatedUser> {
    const currentUser = this._currentUser();

    if (this._authStatus() === 'authenticated' && currentUser !== null) {
      return of(currentUser);
    }

    if (this.currentUserRequest$ !== null) {
      return this.currentUserRequest$;
    }

    this._authStatus.set('checking');

    const request$ = this.http.get<AuthenticatedUser>(`${this.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.setAuthenticated(user);
      }),

      finalize(() => {
        this.currentUserRequest$ = null;
      }),

      shareReplay({
        bufferSize: 1,
        refCount: false,
      }),
    );

    this.currentUserRequest$ = request$;

    return request$;
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, null).pipe(
      tap(() => {
        this.markAnonymous();
      }),
    );
  }

  markAnonymous(): void {
    this._currentUser.set(null);
    this._authStatus.set('anonymous');
  }

  private setAuthenticated(user: AuthenticatedUser): void {
    this._currentUser.set(user);
    this._authStatus.set('authenticated');
  }
}
