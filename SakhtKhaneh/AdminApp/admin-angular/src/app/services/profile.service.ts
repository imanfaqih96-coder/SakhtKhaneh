import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Profile {
  userName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  passwordChangedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly apiUrl = `${window.location.origin}/api`;

  constructor(private readonly http: HttpClient) {}

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/GetProfile`);
  }

  updateProfile(data: Pick<Profile, 'firstName' | 'lastName' | 'email'>): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(`${this.apiUrl}/updateProfile`, data);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(`${this.apiUrl}/changePassword`, {
      currentPassword,
      newPassword
    });
  }
}
