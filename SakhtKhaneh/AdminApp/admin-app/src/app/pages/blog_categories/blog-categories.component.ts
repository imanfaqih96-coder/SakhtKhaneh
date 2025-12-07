import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageDialogComponent } from '../components/message/message-dialog.component';
import { CreateEditCategoryDialogComponent } from './create-edit-category-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';

export interface BlogCategoryItem {
  id: number;
  title: string;
}

@Component({
  selector: 'blog-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './blog-categories.component.html',
  styleUrls: ['./blog-categories.component.css']
})
export class BlogCategoriesComponent implements OnInit {
  apiUrl = `${window.location.origin}/api`;
  categories: BlogCategoryItem[] = [];
  displayedColumns = ['id', 'title', 'actions'];
  filteredCategories: BlogCategoryItem[] = [];

  searchTerm = '';

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.http.get<BlogCategoryItem[]>(`${this.apiUrl}/blog/categories/get`)
      .subscribe(res => {
        this.categories = res;
        this.filteredCategories = [...this.categories];
        this.cd.detectChanges();
      });
  }

  search() {
    const term = this.searchTerm.toLowerCase();
    this.filteredCategories = this.categories.filter(c => c.title.toLowerCase().includes(term));
  }

  createCategory() {
    const dialogRef = this.dialog.open(CreateEditCategoryDialogComponent, {
      data: { title: '' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.title) {
        this.http.post(`${this.apiUrl}/blog/categories/create`, { title: result.title }).subscribe({
          next: (res: any) => {
            if (res.status === 'success') {
              this.loadCategories();
              this.cd.detectChanges();
            }
          },
          error: (err) => console.error(err)
        });
      }
    });
  }

  editCategory(category: BlogCategoryItem) {
    const dialogRef = this.dialog.open(CreateEditCategoryDialogComponent, {
      data: { title: category.title }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.title) {
        // Call update API (you can implement /blog/categories/update endpoint)
        this.http.post(`${this.apiUrl}/blog/categories/update`, { id: category.id, title: result.title }).subscribe({
          next: (res: any) => {
            if (res.status === 'success') {
              this.loadCategories();
              this.cd.detectChanges();
            }
          },
          error: (err) => console.error(err)
        });
      }
    });
  }

  deleteCategory(category: BlogCategoryItem) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'حذف دسته بندی', message: `آیا مطمئن هستید می‌خواهید دسته "${category.title}" را حذف کنید؟` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Call delete API (implement /blog/categories/delete endpoint)
        this.http.post(`${this.apiUrl}/blog/categories/delete`, { id: category.id }).subscribe({
          next: () => {
            this.loadCategories();
            this.cd.detectChanges();
          },
          error: (err) => console.error(err)
        });
      }
    });
  }
}
