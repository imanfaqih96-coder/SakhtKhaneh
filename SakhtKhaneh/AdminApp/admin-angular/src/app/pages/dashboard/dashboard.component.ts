import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AgCharts } from 'ag-charts-community';
import '../../charts/ag-charts-setup';
import { AnalyticsService, DashboardStats } from '../../services/analytics.service';
import { PopularPagesService, PopularVisit } from '../../services/popular-pages.service';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';
import { PersianDatePipe } from '../../shared/persian-date.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [
    CommonModule,
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    PersianDatePipe
  ]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['index', 'path', 'count', 'lastVisit', 'type', 'link'];
  dataSource = new MatTableDataSource<PopularVisit>();
  stats: DashboardStats = {
    from: '',
    to: '',
    totalVisits: 0,
    totalUsers: 0,
    citiesCount: 0,
    countriesCount: 0,
    changePercent: 0,
    trend: []
  };
  loading = true;

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild('visitsTrend') visitsTrend?: ElementRef<HTMLDivElement>;

  private refreshTimer?: ReturnType<typeof setInterval>;
  private trendChart?: ReturnType<typeof AgCharts.create>;
  private viewReady = false;

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly popularPagesService: PopularPagesService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadPopularPages();
    this.refreshTimer = setInterval(() => {
      this.loadStats();
      this.loadPopularPages();
    }, 120000);
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.paginator) this.dataSource.paginator = this.paginator;
    this.renderTrend();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.trendChart?.destroy();
  }

  openReport(metric: 'visits' | 'users' | 'cities' | 'countries'): void {
    void this.router.navigate(['/reports'], { queryParams: { metric } });
  }

  private loadStats(): void {
    this.loading = true;
    this.analytics.getDashboardStats()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => {
          this.stats = data;
          queueMicrotask(() => this.renderTrend());
        },
        error: error => console.error('Failed to load dashboard stats', error)
      });
  }

  private loadPopularPages(): void {
    this.popularPagesService.getPopularPages().subscribe({
      next: data => {
        const origin = window.location.origin;
        this.dataSource.data = data.map(item => ({ ...item, link: origin + item.path }));
      },
      error: error => console.error('Failed to load popular pages', error)
    });
  }

  private renderTrend(): void {
    if (!this.viewReady || !this.visitsTrend?.nativeElement || !this.stats.trend.length) return;

    this.trendChart?.destroy();
    this.trendChart = AgCharts.create({
      container: this.visitsTrend.nativeElement,
      autoSize: true,
      background: { fill: 'transparent' },
      padding: { top: 4, right: 0, bottom: 0, left: 0 },
      animation: { enabled: true, duration: 700 },
      data: this.stats.trend.map(item => ({
        date: new Date(item.date).toLocaleDateString('fa-IR-u-ca-persian', { timeZone: 'Asia/Tehran', month: 'short', day: 'numeric' }),
        value: item.value
      })),
      legend: { enabled: false },
      axes: [
        {
          type: 'category',
          position: 'bottom',
          label: { enabled: false },
          line: { enabled: false },
          tick: { enabled: false }
        },
        {
          type: 'number',
          position: 'left',
          label: { enabled: false },
          line: { enabled: false },
          tick: { enabled: false },
          gridLine: { enabled: false }
        }
      ],
      series: [{
        type: 'area',
        xKey: 'date',
        yKey: 'value',
        stroke: '#f2b84b',
        fill: 'rgba(242, 184, 75, .16)',
        strokeWidth: 2,
        marker: { enabled: false },
        tooltip: { enabled: true }
      }]
    } as any);
  }
}
