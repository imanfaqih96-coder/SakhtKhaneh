import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';



export interface User {
  username: string;
  password: string;
  email?: string;
  AdministrativeApproval: boolean;
}

const STORAGE_KEY = 'auth_user';

interface AuthResponse {
  status: 'success' | 'fail' | 'pending';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {


  private apiUrl = 'https://localhost:7115/api';
  private tokenKey = 'jwtToken';

  private users: User[] = [];

  constructor(private http: HttpClient) {
    if (!this.users.find(u => u.username === 'admin')) {
      this.users.push({ username: 'admin', password: 'admin', AdministrativeApproval: true });
      const { protocol, hostname, port } = window.location;
      this.apiUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
    }
  }

  login(username: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(tap(res => {
        if (res.status === 'success') {
          //success
          console.log('success login.');
        }
      }));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  register(username: string, password: string, email: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.apiUrl}/auth/register`, { username, password, email });
  }

  getUsers(): User[] {
    return this.users;
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('auth_user') !== null;
  }

  // -------------------------
  // session helpers (localStorage)
  // -------------------------
  setCurrentUser(username: string) {
    localStorage.setItem(STORAGE_KEY, username);
  }

  getCurrentUser(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

}
