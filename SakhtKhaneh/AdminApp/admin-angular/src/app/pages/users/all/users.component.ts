import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { PersianDatePipe } from '../../../shared/persian-date.pipe';

export interface UserItem {
  id: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  administrativeApproval: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
  imports: [CommonModule, FormsModule, MatTableModule, MatPaginatorModule, MatCardModule, MatIconModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatSelectModule, MatChipsModule, PersianDatePipe]
})
export class UsersComponent implements OnInit, AfterViewInit {
  displayedColumns = ['userName', 'email', 'name', 'passwordStatus', 'lastLogin'];
  dataSource = new MatTableDataSource<UserItem>([]);
  loading = true;
  statusFilter = 'all';
  searchValue = '';
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private readonly http: HttpClient) {
    this.dataSource.filterPredicate = (user, filter) => {
      const criteria = JSON.parse(filter) as { search: string; status: string };
      const haystack = `${user.userName} ${user.email} ${user.firstName ?? ''} ${user.lastName ?? ''}`.toLowerCase();
      const statusMatches = criteria.status === 'all'
        || (criteria.status === 'secure' && !user.mustChangePassword)
        || (criteria.status === 'must-change' && user.mustChangePassword);
      return statusMatches && haystack.includes(criteria.search);
    };
  }

  ngOnInit(): void {
    this.http.get<UserItem[]>(`${window.location.origin}/api/users`)
      .pipe(finalize(() => this.loading = false))
      .subscribe(users => this.dataSource.data = users);
  }

  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; }

  applyFilters(): void {
    this.dataSource.filter = JSON.stringify({ search: this.searchValue.trim().toLowerCase(), status: this.statusFilter });
    this.dataSource.paginator?.firstPage();
  }
}
