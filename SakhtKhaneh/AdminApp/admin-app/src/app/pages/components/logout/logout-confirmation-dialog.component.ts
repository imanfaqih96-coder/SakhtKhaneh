// logout-confirmation-dialog.component.ts
import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logout-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="warn" class="mr-2">logout</mat-icon>
      خروج از حساب
    </h2>

    <mat-dialog-content>
      آیا مطمئن هستید که می‌خواهید از حساب کاربری خارج شوید؟
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close cdkFocusInitial>انصراف</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">خروج</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display: flex; align-items: center; font-weight: 600; }
    mat-icon { font-size: 28px; }
  `]
})
export class LogoutConfirmationDialogComponent { }
