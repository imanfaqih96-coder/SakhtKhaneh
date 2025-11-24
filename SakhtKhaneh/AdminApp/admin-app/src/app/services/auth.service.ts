import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root', // <- this makes it globally injectable
})
export class AuthService {
  private mockUser = { email: 'user@example.com', password: '123456', token: 'fake-jwt-token' };

  login(credentials: { email: string; password: string }): Observable<{ token: string }> {
    if (
      credentials.email === this.mockUser.email &&
      credentials.password === this.mockUser.password
    ) {
      return of({ token: this.mockUser.token });
    } else {
      return throwError(() => new Error('Invalid credentials'));
    }
  }

  logout() {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
