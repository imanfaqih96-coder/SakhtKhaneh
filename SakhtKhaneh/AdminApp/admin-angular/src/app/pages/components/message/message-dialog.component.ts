import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-message-dialog',
  standalone: true,
  template: `
  <div class="message-dialog-body">
    <h3 class="text-lg font-bold mb-3">{{ data.title }}</h3>
    <p class="text-base mb-4">{{ data.message }}</p>

    <div class="flex justify-end">
      <button mat-raised-button color="primary" (click)="close()">باشه</button>
    </div>
  </div>
  `,
  imports: [MatDialogModule, MatButtonModule]
})
export class MessageDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<MessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) { }

  close() {
    this.dialogRef.close();
  }
}
