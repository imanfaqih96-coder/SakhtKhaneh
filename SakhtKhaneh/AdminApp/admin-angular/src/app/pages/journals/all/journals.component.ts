import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { JournalItem, JournalsService } from '../../../services/journals.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '../../components/message/message-dialog.component';
import { PersianDatePipe } from '../../../shared/persian-date.pipe';

@Component({
  selector: 'app-journals',
  standalone: true,
  templateUrl: './journals.html',
  styleUrls: ['./journals.css'],
  imports: [CommonModule, RouterLink, MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule, MatChipsModule, PersianDatePipe]
})
export class JournalsComponent implements OnInit {
  displayedColumns = ['image', 'title', 'path', 'status', 'date', 'actions'];
  dataSource = new MatTableDataSource<JournalItem>([]);
  loading = true;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private readonly journals: JournalsService, private readonly dialog: MatDialog) {}

  ngOnInit(): void { this.load(); }

  applyFilter(value: string): void { this.dataSource.filter = value.trim().toLowerCase(); }

  delete(item: JournalItem): void {
    if (!item.id || !window.confirm(`ژورنال «${item.title}» حذف شود؟`)) return;
    this.journals.delete(item.id).subscribe({
      next: () => this.load(),
      error: error => this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: error?.error?.message ?? 'حذف ژورنال انجام نشد.' } })
    });
  }

  private load(): void {
    this.loading = true;
    this.journals.getAll().pipe(finalize(() => this.loading = false)).subscribe({
      next: items => {
        this.dataSource.data = items;
        queueMicrotask(() => this.dataSource.paginator = this.paginator);
      },
      error: () => this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'دریافت فهرست ژورنال‌ها انجام نشد.' } })
    });
  }
}
