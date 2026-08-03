import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AgCharts } from 'ag-charts-community';
import '../../charts/ag-charts-setup';
import {
  AnalyticsMetric,
  AnalyticsReport,
  AnalyticsService
} from '../../services/analytics.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs';
import { PersianDatePipe } from '../../shared/persian-date.pipe';
import { formatPersianDateInput, parsePersianDate } from '../../shared/persian-date';

@Component({
  selector: 'app-reports',
  standalone: true,
  templateUrl: './reports.html',
  styleUrls: ['./reports.css'],
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    PersianDatePipe
  ]
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mainChart') mainChart?: ElementRef<HTMLDivElement>;

  metric: AnalyticsMetric = 'visits';
  from = '';
  to = '';
  preset = '30';
  loading = false;
  report: AnalyticsReport | null = null;

  readonly metrics: { value: AnalyticsMetric; label: string }[] = [
    { value: 'visits', label: 'بازدید صفحات' },
    { value: 'users', label: 'بازدیدکنندگان یکتا' },
    { value: 'cities', label: 'شهرهای شناسایی‌شده' },
    { value: 'countries', label: 'کشورهای شناسایی‌شده' }
  ];

  private chart?: ReturnType<typeof AgCharts.create>;
  private viewReady = false;

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const requestedMetric = this.route.snapshot.queryParamMap.get('metric') as AnalyticsMetric | null;
    if (requestedMetric && this.metrics.some(item => item.value === requestedMetric)) {
      this.metric = requestedMetric;
    }
    this.applyPreset('30', false);
    this.load();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  applyPreset(days: string, reload = true): void {
    this.preset = days;
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (Number(days) - 1));
    this.from = formatPersianDateInput(start);
    this.to = formatPersianDateInput(end);
    if (reload) this.load();
  }

  customRangeChanged(): void {
    this.preset = 'custom';
  }

  load(): void {
    const fromDate = parsePersianDate(this.from);
    const toDate = parsePersianDate(this.to);
    if (!fromDate || !toDate) return;

    this.loading = true;
    this.analytics.getReport(this.metric, this.toApiDate(fromDate), this.toApiDate(toDate))
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: report => {
          this.report = report;
          queueMicrotask(() => this.renderChart());
        },
        error: error => console.error('Failed to load analytics report', error)
      });
  }

  private renderChart(): void {
    if (!this.viewReady || !this.mainChart?.nativeElement || !this.report) return;

    this.chart?.destroy();
    const data = this.report.series.map(item => ({
      date: new Date(item.date).toLocaleDateString('fa-IR-u-ca-persian', { timeZone: 'Asia/Tehran', month: 'short', day: 'numeric' }),
      value: item.value
    }));

    this.chart = AgCharts.create({
      container: this.mainChart.nativeElement,
      autoSize: true,
      background: { fill: 'transparent' },
      animation: { enabled: true, duration: 850 },
      padding: { top: 16, right: 18, bottom: 8, left: 8 },
      data,
      legend: { enabled: false },
      axes: [
        {
          type: 'category',
          position: 'bottom',
          label: { color: '#7b8991', fontSize: 11, avoidCollisions: true },
          line: { stroke: '#dfe6e9' },
          tick: { stroke: '#dfe6e9' }
        },
        {
          type: 'number',
          position: 'left',
          label: { color: '#7b8991', fontSize: 11 },
          gridLine: { style: [{ stroke: '#e9eef0', lineDash: [4, 5] }] }
        }
      ],
      series: [{
        type: 'area',
        xKey: 'date',
        yKey: 'value',
        yName: this.report.title,
        stroke: '#db9f32',
        fill: 'rgba(219, 159, 50, .15)',
        strokeWidth: 2.5,
        marker: { enabled: true, size: 4, fill: '#f2b84b', stroke: '#fff', strokeWidth: 2 },
        tooltip: { enabled: true }
      }]
    } as any);
  }

  private toApiDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
