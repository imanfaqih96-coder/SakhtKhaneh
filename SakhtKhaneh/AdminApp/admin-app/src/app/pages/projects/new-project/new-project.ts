import { Component, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MessageDialogComponent } from '../../components/message/message-dialog.component';

@Component({
  selector: 'new-project',
  standalone: true,
  templateUrl: './new-project.html',
  styleUrls: ['./new-project.css'],
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ]
})
export class NewProjectComponent implements AfterViewInit {

  private apiUrl = `${window.location.origin}/api/projects`;

  // Form fields
  endpoint_Path = '';
  title = '';
  description = '';
  content = '';
  startDate: string | null = null;
  endDate: string | null = null;
  location = '';
  owner = '';

  // Cover
  coverFile: File | null = null;
  coverPreview: string | null = null;
  coverUrl: string | null = null;

  // Gallery
  galleryFiles: File[] = [];
  galleryPreviews: string[] = [];
  galleryUrls: string[] = [];

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private ngZone: NgZone
  ) { }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }

  // ───────── COVER HANDLERS ─────────
  onCoverSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleCover(file);
  }

  onCoverDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleCover(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private handleCover(file: File) {
    this.coverFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = () => this.ngZone.run(() => this.coverPreview = reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    const fd = new FormData();
    fd.append('cover', file);
    this.http.post<{ url: string }>(`${this.apiUrl}/uploadCover`, fd)
      .subscribe({
        next: res => this.coverUrl = res.url,
        error: err => {
          console.error('Cover upload failed', err);
          this.coverFile = null;
          this.coverPreview = null;
          this.coverUrl = null;
        }
      });
  }

  removeCover() {
    this.coverFile = null;
    this.coverPreview = null;
    this.coverUrl = null;
  }

  // ───────── GALLERY HANDLERS ─────────
  onGallerySelect(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    this.handleGallery(Array.from(files));
  }

  onGalleryDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files) return;
    this.handleGallery(Array.from(files));
  }

  private handleGallery(files: File[]) {
    files.filter(f => f.type.startsWith('image/')).forEach(file => {
      // Preview
      const reader = new FileReader();
      reader.onload = () => this.ngZone.run(() => this.galleryPreviews.push(reader.result as string));
      reader.readAsDataURL(file);

      // Upload
      const fd = new FormData();
      fd.append('gallery', file);
      this.http.post<{ url: string }>(`${this.apiUrl}/uploadGallery`, fd)
        .subscribe({
          next: res => this.galleryUrls.push(res.url),
          error: err => console.error('Gallery upload failed', err)
        });

      this.galleryFiles.push(file);
    });
  }

  removeGalleryImage(index: number) {
    this.galleryFiles.splice(index, 1);
    this.galleryPreviews.splice(index, 1);
    this.galleryUrls.splice(index, 1);
  }

  resetGallery() {
    this.galleryFiles = [];
    this.galleryPreviews = [];
    this.galleryUrls = [];
  }

  // ───────── SUBMIT PROJECT ─────────
  submitProject() {
    if (!this.title || !this.endpoint_Path || !this.content) {
      this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'فیلدهای ضروری را تکمیل کنید' } });
      return;
    }

    const body = {
      Title: this.title,
      Endpoint_Path: this.endpoint_Path,
      CoverImageUrl: this.coverUrl,
      Description: this.description,
      StartDate: this.startDate,
      EndDate: this.endDate,
      Location: this.location,
      Owner: this.owner,
      Content: this.content,
      Gallery: this.galleryUrls
    };

    this.http.post(`${this.apiUrl}/create`, body).subscribe({
      next: () => {
        this.dialog.open(MessageDialogComponent, { data: { title: 'موفق', message: 'پروژه با موفقیت ثبت شد' } });
        this.resetForm();
      },
      error: () => this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'ثبت پروژه انجام نشد' } })
    });
  }

  private resetForm() {
    this.title = '';
    this.endpoint_Path = '';
    this.description = '';
    this.content = '';
    this.startDate = null;
    this.endDate = null;
    this.location = '';
    this.owner = '';
    this.removeCover();
    this.resetGallery();
  }
}
