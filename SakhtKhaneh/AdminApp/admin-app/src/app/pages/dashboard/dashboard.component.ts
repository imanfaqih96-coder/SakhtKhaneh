import { Component, OnInit, ChangeDetectorRef, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; // ✅ for pipes like number, date, etc.
import { GlobalService } from '../../services/global.service';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { PopularPagesService, PopularVisit } from '../../services/popular-pages.service';

import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    CommonModule,
    DecimalPipe,
    MatTableModule,
    MatPaginatorModule
  ]
})
export class DashboardComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['index', 'path', 'count', 'lastVisit', 'type', 'param', 'link'];
  dataSource = new MatTableDataSource<PopularVisit>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  constructor(
    private global: GlobalService,
    private dashboardService: DashboardService,
    private popularPagesService: PopularPagesService,
    private cd: ChangeDetectorRef
  ) { }

  stats: DashboardStats = { totalVisits: 0, citiesCount: 0, countriesCount: 0, totalUsers: 0 };

  ngOnInit(): void {
    this.loadStats();
    setInterval(() => this.loadStats(), 1000); // refresh every 1 seconds
    try {
      this.loadPopularPages();
    }
    catch (exception) {
      console.log(exception);
    }
  }

  loadStats() {
    this.dashboardService.getStats().subscribe({
      next: (data: DashboardStats) => {
        this.stats = data;
        this.cd.detectChanges();
      },
      error: (err: any) => console.error('Failed to load stats', err)
    });
  }

  loadPopularPages() {
    this.popularPagesService.getPopularPages().subscribe({
      next: (data) => {
        const origin = window.location.origin;
        data = data.map(x => ({ ...x, link: origin + x.path }));
        this.dataSource.data = data;
        this.cd.detectChanges(); // ✅ force render
      },
      error: (err) => console.error(err)
    });
  }

  logout() {
    this.global.logout();
  }
} 
