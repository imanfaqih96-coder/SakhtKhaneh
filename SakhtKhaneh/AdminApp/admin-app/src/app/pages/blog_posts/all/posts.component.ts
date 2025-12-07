import { Component, ChangeDetectorRef, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProfileService } from '../../../services/profile.service';

import { MessageDialogComponent } from '../../components/message/message-dialog.component';

// material imports
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
export interface BlogPostItem {
  id: string;
  title: string;
  description: string;
  creationDate: Date;
  lastUpdateDate: Date | null;
};

@Component({
  selector: 'app-blog-posts',
  standalone: true,
  templateUrl: './posts.html',
  styleUrls: ['./posts.css'],
  imports: [
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatInputModule
  ]
})

export class BlogPostsComponent implements AfterViewInit {

  displayedColumns: string[] = ['index', 'image', 'title', 'description', 'options'];
  dataSource = new MatTableDataSource<BlogPostItem>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private profileService: ProfileService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private http: HttpClient) {
    // constructor logic
  }

  ngAfterViewInit() {
    // on init logic
    this.loadPosts();
    this.cd.detectChanges();
  }

  loadPosts() {
    this.http.get<BlogPostItem[]>(`${window.location.origin}/api/blog/posts/get`)
      .subscribe(res => {
        this.dataSource.data = res.map((p, i) => ({
          ...p,
          startDate: p.creationDate ? new Date(p.creationDate) : null,
          lastUpdateDate: p.lastUpdateDate ? new Date(p.lastUpdateDate) : null,
          gallery: Array.isArray((p as any).gallery) ? (p as any).gallery : []
        }));
        this.dataSource.paginator = this.paginator;
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

}
