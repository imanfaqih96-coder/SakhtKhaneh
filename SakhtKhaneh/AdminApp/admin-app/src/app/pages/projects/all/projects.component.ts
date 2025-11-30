import { Component, AfterViewInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { MessageDialogComponent } from '../../components/message/message-dialog.component';

// material imports
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';

export interface ProjectItem {
  id: string;
  title: string;
  coverImageUrl: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  location?: string | null;
  owner?: string | null;
  content: string;
  gallery: any[];
}


@Component({
  selector: 'projects-list',
  standalone: true,
  templateUrl: './projects.html',
  styleUrls: ['./projects.css'],
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatCardModule
  ]
})

export class ProjectsComponent implements AfterViewInit {

  displayedColumns: string[] = ['index', 'image', 'title', 'description', 'options'];
  dataSource = new MatTableDataSource<ProjectItem>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private dialog: MatDialog) {
    //construction logic
  }
  ngAfterViewInit() {
    //after init logic
    this.loadProjects(); 
    this.cd.detectChanges();
  }

  loadProjects() {
    this.http.get<ProjectItem[]>(`${window.location.origin}/api/getProjects`)
      .subscribe(res => {
        this.dataSource.data = res.map((p, i) => ({
          ...p,
          startDate: p.startDate ? new Date(p.startDate) : null,
          endDate: p.endDate ? new Date(p.endDate) : null,
          gallery: Array.isArray((p as any).gallery) ? (p as any).gallery : []
        }));
        this.dataSource.paginator = this.paginator;
      });
  }

  openInfo(project: ProjectItem) {
    this.dialog.open(MessageDialogComponent, {
      data: {
        title: project.title,
        message: project.description ?? 'بدون توضیحات'
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

}
