import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'create-edit-category-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title ? 'ویرایش دسته بندی' : 'ایجاد دسته بندی' }}</h2>
    <mat-dialog-content>
      <mat-form-field class="w-100">
        <mat-label>نام دسته بندی</mat-label>
        <input matInput [(ngModel)]="data.title">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">لغو</button>
      <button mat-flat-button color="primary" (click)="dialogRef.close(data)">ذخیره</button>
    </mat-dialog-actions>
  `
})
export class CreateEditCategoryDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CreateEditCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string }
  ) { }
}
