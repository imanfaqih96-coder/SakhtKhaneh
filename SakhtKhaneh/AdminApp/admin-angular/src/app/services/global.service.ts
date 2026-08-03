import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GlobalService {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigate(['/login']));
  }

  getCurrentUser(): string | null {
    return this.auth.currentSession?.userName ?? null;
  }
}
