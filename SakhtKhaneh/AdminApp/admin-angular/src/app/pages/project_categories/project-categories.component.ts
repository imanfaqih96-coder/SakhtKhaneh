import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageDialogComponent } from '../components/message/message-dialog.component';
import { TaxonomyEditorData, TaxonomyEditorDialogComponent, TaxonomyOption } from '../../shared/taxonomy-editor-dialog.component';

export interface ProjectCategoryItem {
  id: string;
  parentId?: string | null;
  title: string;
  slug: string;
  sortOrder: number;
  isVisible: boolean;
  projectCount: number;
  children: ProjectCategoryItem[];
}

interface FlatProjectCategory extends ProjectCategoryItem {
  depth: number;
}

@Component({
  selector: 'app-project-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatChipsModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './project-categories.component.html',
  styleUrls: ['./project-categories.component.css']
})
export class ProjectCategoriesComponent implements OnInit {
  private readonly apiUrl = `${window.location.origin}/api/project-categories`;
  roots: ProjectCategoryItem[] = [];
  flat: FlatProjectCategory[] = [];
  filtered: FlatProjectCategory[] = [];
  searchTerm = '';
  loading = true;

  constructor(private http: HttpClient, private dialog: MatDialog, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<ProjectCategoryItem[]>(`${this.apiUrl}/get`).subscribe({
      next: items => {
        this.roots = items ?? [];
        this.flat = this.flatten(this.roots);
        this.applyFilter();
        this.loading = false;
        this.cd.detectChanges();
      },
      error: error => {
        this.loading = false;
        this.showError(error?.error?.message ?? 'دریافت دسته‌بندی‌های پروژه انجام نشد.');
        this.cd.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLocaleLowerCase('fa');
    this.filtered = !term ? [...this.flat] : this.flat.filter(item => `${item.title} ${item.slug}`.toLocaleLowerCase('fa').includes(term));
  }

  create(parent?: ProjectCategoryItem): void {
    this.openEditor({
      heading: parent ? `افزودن زیرشاخه به «${parent.title}»` : 'ایجاد دسته‌بندی پروژه',
      title: '', slug: '', parentId: parent?.id ?? null, sortOrder: 0, isVisible: true,
      parents: this.parentOptions()
    }, 'create');
  }

  edit(item: ProjectCategoryItem): void {
    this.openEditor({
      heading: `ویرایش «${item.title}»`, id: item.id, title: item.title, slug: item.slug,
      parentId: item.parentId ?? null, sortOrder: item.sortOrder, isVisible: item.isVisible,
      parents: this.parentOptions(item.id)
    }, 'update');
  }

  delete(item: ProjectCategoryItem): void {
    if (!window.confirm(`دسته‌بندی «${item.title}» حذف شود؟`)) return;
    this.http.delete(`${this.apiUrl}/${item.id}`).subscribe({
      next: () => this.load(),
      error: error => this.showError(error?.error?.message ?? 'حذف دسته‌بندی انجام نشد.')
    });
  }

  private openEditor(data: TaxonomyEditorData, action: 'create' | 'update'): void {
    this.dialog.open(TaxonomyEditorDialogComponent, { data, width: '580px', maxWidth: '94vw' })
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.http.post(`${this.apiUrl}/${action}`, {
          id: result.id ?? null,
          parentId: result.parentId ?? null,
          title: result.title,
          slug: result.slug,
          sortOrder: Number(result.sortOrder) || 0,
          isVisible: Boolean(result.isVisible)
        }).subscribe({
          next: () => this.load(),
          error: error => this.showError(error?.error?.message ?? 'ذخیره دسته‌بندی انجام نشد.')
        });
      });
  }

  private flatten(items: ProjectCategoryItem[], depth = 0): FlatProjectCategory[] {
    return items.flatMap(item => [{ ...item, depth }, ...this.flatten(item.children ?? [], depth + 1)]);
  }

  private parentOptions(excludedId?: string): TaxonomyOption[] {
    const excluded = new Set<string>();
    if (excludedId) {
      excluded.add(excludedId);
      const addChildren = (id: string) => this.flat.filter(item => item.parentId === id).forEach(child => { excluded.add(child.id); addChildren(child.id); });
      addChildren(excludedId);
    }
    return this.flat.filter(item => !excluded.has(item.id)).map(item => ({ id: item.id, title: item.title, depth: item.depth }));
  }

  private showError(message: string): void {
    this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message } });
  }
}
