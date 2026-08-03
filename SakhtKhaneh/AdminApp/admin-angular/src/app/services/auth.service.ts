import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, shareReplay, tap } from 'rxjs';

export interface AuthSession {
  authenticated: boolean;
  userName?: string;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  status: 'success' | 'fail' | 'pending';
  message: string;
  mustChangePassword?: boolean;
  userName?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${window.location.origin}/api`;
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(null);
  private sessionRequest?: Observable<AuthSession>;

  readonly session$ = this.sessionSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      tap(response => {
        if (response.status === 'success') {
          this.sessionSubject.next({
            authenticated: true,
            userName: response.userName ?? username,
            mustChangePassword: response.mustChangePassword === true
          });
        }
      })
    );
  }


  register(username: string, password: string, email: string, firstName?: string, lastName?: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, {
      username,
      password,
      email,
      firstName,
      lastName
    });
  }

  loadSession(force = false): Observable<AuthSession> {
    const cached = this.sessionSubject.value;
    if (!force && cached) {
      return of(cached);
    }

    if (!force && this.sessionRequest) {
      return this.sessionRequest;
    }

    this.sessionRequest = this.http.get<AuthSession>(`${this.apiUrl}/auth/session`).pipe(
      map(session => ({
        authenticated: session.authenticated === true,
        userName: session.userName,
        mustChangePassword: session.mustChangePassword === true
      })),
      catchError(() => of({ authenticated: false, mustChangePassword: false })),
      tap(session => {
        this.sessionSubject.next(session);
        this.sessionRequest = undefined;
      }),
      shareReplay(1)
    );

    return this.sessionRequest;
  }

  refreshSession(): Observable<AuthSession> {
    this.sessionRequest = undefined;
    return this.loadSession(true);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}).pipe(
      catchError(() => of(void 0)),
      tap(() => {
        this.sessionRequest = undefined;
        this.sessionSubject.next({ authenticated: false, mustChangePassword: false });
      })
    );
  }

  clearSession(): void {
    this.sessionRequest = undefined;
    this.sessionSubject.next({ authenticated: false, mustChangePassword: false });
  }

  get currentSession(): AuthSession | null {
    return this.sessionSubject.value;
  }
}
