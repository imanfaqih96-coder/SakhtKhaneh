import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PopularVisit {
  path: string;
  type: string;
  param: string | null;
  count: number;
  lastVisit: string;
  link?: string;
}

@Injectable({ providedIn: 'root' })
export class PopularPagesService {
  constructor(private http: HttpClient) { }

  getPopularPages(): Observable<PopularVisit[]> {
    return this.http.get<PopularVisit[]>('/Api/popular-paths');
  }
}
