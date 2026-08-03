import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface TaxonomyOption {
  id: string | number;
  title: string;
  depth: number;
}

export interface TaxonomyEditorData {
  heading: string;
  id?: string | number | null;
  title: string;
  slug: string;
  parentId?: string | number | null;
  sortOrder: number;
  isVisible: boolean;
  parents: TaxonomyOption[];
}

@Component({
  selector: 'app-taxonomy-editor-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data.heading }}</h2>
    <mat-dialog-content class="taxonomy-dialog">
      <mat-form-field appearance="outline">
        <mat-label>عنوان</mat-label>
        <input matInput [(ngModel)]="data.title" maxlength="180" required />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>مسیر انگلیسی</mat-label>
        <input matInput [(ngModel)]="data.slug" dir="ltr" placeholder="interior-design" required />
        <mat-hint>حروف انگلیسی، عدد و خط تیره</mat-hint>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>دسته والد</mat-label>
        <mat-select [(ngModel)]="data.parentId">
          <mat-option [value]="null">بدون والد — شاخه اصلی</mat-option>
          <mat-option *ngFor="let parent of data.parents" [value]="parent.id">
            {{ '— '.repeat(parent.depth) }}{{ parent.title }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>ترتیب نمایش</mat-label>
        <input matInput type="number" [(ngModel)]="data.sortOrder" min="0" />
      </mat-form-field>
      <mat-slide-toggle [(ngModel)]="data.isVisible">نمایش در سایت و منو</mat-slide-toggle>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">انصراف</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!data.title.trim() || !data.slug.trim()" (click)="dialogRef.close(data)">ذخیره</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .taxonomy-dialog{display:grid;gap:12px;min-width:min(520px,80vw);padding-top:8px}.taxonomy-dialog mat-form-field{width:100%}
    @media(max-width:600px){.taxonomy-dialog{min-width:0;width:100%}}
  `]
})
export class TaxonomyEditorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TaxonomyEditorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaxonomyEditorData
  ) {}
}
