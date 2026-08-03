import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalyticsPoint {
  date: string;
  value: number;
}

export interface DashboardStats {
  from: string;
  to: string;
  totalVisits: number;
  totalUsers: number;
  citiesCount: number;
  countriesCount: number;
  changePercent: number;
  trend: AnalyticsPoint[];
}

export interface AnalyticsBreakdown {
  label: string;
  path?: string | null;
  value: number;
}

export type AnalyticsMetric = 'visits' | 'users' | 'cities' | 'countries';

export interface AnalyticsReport {
  metric: AnalyticsMetric;
  title: string;
  from: string;
  to: string;
  total: number;
  changePercent: number;
  series: AnalyticsPoint[];
  breakdown: AnalyticsBreakdown[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly apiUrl = `${window.location.origin}/api`;

  constructor(private readonly http: HttpClient) {}

  getDashboardStats(from?: string, to?: string): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`, {
      params: this.rangeParams(from, to)
    });
  }

  getReport(metric: AnalyticsMetric, from?: string, to?: string): Observable<AnalyticsReport> {
    let params = this.rangeParams(from, to);
    params = params.set('metric', metric);
    return this.http.get<AnalyticsReport>(`${this.apiUrl}/reports/overview`, { params });
  }

  private rangeParams(from?: string, to?: string): HttpParams {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return params;
  }
}
