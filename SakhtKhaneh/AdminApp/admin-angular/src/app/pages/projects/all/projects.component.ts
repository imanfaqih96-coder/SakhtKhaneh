import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageDialogComponent } from '../../components/message/message-dialog.component';
import { toPersianDigits } from '../../../shared/persian-date';

interface ProjectCategoryRef {
  id: string;
  title: string;
  slug: string;
}

export interface ProjectItem {
  id: string;
  endpoint_Path: string;
  title: string;
  coverImageUrl: string;
  coverImageAlt?: string;
  description?: string | null;
  time?: string | null;
  location?: string | null;
  owner?: string | null;
  categoryId?: string | null;
  category?: ProjectCategoryRef | null;
  status: 0 | 1 | 2;
  content: string;
  gallery: unknown[];
}

@Component({
  selector: 'projects-list',
  standalone: true,
  templateUrl: './projects.html',
  styleUrls: ['./projects.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatInputModule
  ]
})
export class ProjectsComponent implements AfterViewInit {
  displayedColumns: string[] = ['index', 'image', 'title', 'category', 'status', 'time', 'options'];
  dataSource = new MatTableDataSource<ProjectItem>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly http: HttpClient,
    private readonly cd: ChangeDetectorRef,
    private readonly dialog: MatDialog
  ) {}

  ngAfterViewInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.http.get<ProjectItem[]>(`${window.location.origin}/api/getProjects`).subscribe({
      next: projects => {
        this.dataSource.data = projects.map(project => ({
          ...project,
          gallery: Array.isArray(project.gallery) ? project.gallery : [],
          status: Number(project.status ?? 2) as 0 | 1 | 2
        }));
        this.dataSource.paginator = this.paginator;
        this.cd.detectChanges();
      },
      error: error => {
        console.error('Failed to load projects', error);
        this.dataSource.data = [];
        this.cd.detectChanges();
      }
    });
  }

  displayProjectDate(value?: string | null): string {
    return value ? toPersianDigits(value) : '—';
  }

  statusLabel(status: number): string {
    return status === 0 ? 'در دست طراحی' : status === 1 ? 'در دست ساخت' : 'تکمیل‌شده';
  }

  statusClass(status: number): string {
    return status === 0 ? 'status-design' : status === 1 ? 'status-building' : 'status-completed';
  }

  deleteProject(row: ProjectItem): void {
    if (!row.id || !window.confirm(`پروژه «${row.title}» حذف شود؟`)) return;
    this.http.delete(`${window.location.origin}/api/projects/${row.id}`).subscribe({
      next: () => this.loadProjects(),
      error: error => this.dialog.open(MessageDialogComponent, {
        data: { title: 'خطا', message: error?.error?.message ?? 'حذف پروژه انجام نشد.' }
      })
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }
}
