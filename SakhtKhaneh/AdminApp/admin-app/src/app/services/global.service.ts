import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_user');
  }

  getCurrentUser(): string | null {
    return localStorage.getItem('auth_user');
  }
}
