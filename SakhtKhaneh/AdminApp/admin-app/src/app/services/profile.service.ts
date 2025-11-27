import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Profile {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = `${window.location.origin}/api/GetProfile`;

  constructor(private http: HttpClient) { }

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(this.apiUrl);
  }

  updateProfile(data: Profile): Observable<any> {
    return this.http.post(`${this.apiUrl}/updateProfile`, data);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/changePassword`, { currentPassword, newPassword });
  }
}
