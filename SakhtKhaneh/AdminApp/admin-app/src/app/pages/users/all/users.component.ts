import { Component, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

export interface UserItem {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  administrativeApproval: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
  imports: [
    HttpClientModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatChipsModule
  ],
  providers: [
    { provide: MatPaginatorIntl } 
  ]
})
export class UsersComponent implements AfterViewInit {

  displayedColumns: string[] = ['userName', 'email', 'firstName', 'lastName', 'admin', 'actions'];
  dataSource = new MatTableDataSource<UserItem>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loading = true;

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {
    this.http.get<any[]>(`${window.location.origin}/api/users`)
      .subscribe(res => {
        this.dataSource.data = res;
        this.loading = false;
        this.cd.detectChanges();
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.cd.detectChanges();
  }
}
