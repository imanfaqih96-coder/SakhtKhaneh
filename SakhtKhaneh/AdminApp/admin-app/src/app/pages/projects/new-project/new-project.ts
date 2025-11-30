import { Component, AfterViewInit, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';

// Angular Material modules are imported in the component `imports` array (standalone)
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Local dialog (you already have MessageDialogComponent)
import { MessageDialogComponent } from '../../components/message/message-dialog.component';

type UploadState = 'idle' | 'selected' | 'uploading' | 'uploaded' | 'error';

interface GalleryPreview {
  src: string;             // base64 / object url for preview
  progress: number;        // 0..100
  state: UploadState;      // uploading/uploaded/error
  url?: string | null;     // final server URL after upload
  sub?: Subscription | null; // subscription to cancel
  file?: File;             // original file reference
}

@Component({
  selector: 'new-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    NgxEditorModule
  ],
  templateUrl: './new-project.html',
  styleUrls: ['./new-project.css']
})
export class NewProjectComponent implements OnInit, AfterViewInit {

  private apiUrl = `${window.location.origin}/api/projects`;

  // form fields
  endpoint_Path = '';
  title = '';
  description = '';
  content = '';
  startDate: string | null = null;
  endDate: string | null = null;
  location = '';
  owner = '';

  // Cover uploader
  coverFile: File | null = null;
  coverPreview: string | null = null;   // immediate preview (dataURL)
  coverUrl: string | null = null;       // final server url
  coverProgress = 0;
  coverState: UploadState = 'idle';
  coverSub: Subscription | null = null;

  // Gallery uploader (multiple)
  gallery: GalleryPreview[] = [];

  // NGX-EDITOR
  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    ['link'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.editor = new Editor(); // ✅ initialize
  }

  ngAfterViewInit(): void {
    // ensure initial CD
    this.cd.detectChanges();
  }

  // ---------- COVER HANDLERS ----------
  onCoverSelect(event: Event, inputEl?: HTMLInputElement) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? inputEl?.files?.[0];
    if (!file) return;
    this.startCoverUpload(file);
    // reset native input value to allow re-select same file later
    if (event.target && (event.target as HTMLInputElement).value !== undefined) {
      (event.target as HTMLInputElement).value = '';
    }
  }

  onCoverDrop(ev: DragEvent) {
    ev.preventDefault();
    const f = ev.dataTransfer?.files?.[0];
    if (f) this.startCoverUpload(f);
  }

  onDragOver(ev: DragEvent) { ev.preventDefault(); }

  private startCoverUpload(file: File) {
    this.coverFile = file;
    this.coverState = 'selected';
    // show immediate preview (data URL) inside Angular zone
    const reader = new FileReader();
    reader.onload = () => this.ngZone.run(() => { this.coverPreview = reader.result as string; this.cd.markForCheck(); });
    reader.readAsDataURL(file);

    // build FormData and upload
    const fd = new FormData();
    fd.append('cover', file);

    const req = new HttpRequest('POST', `${this.apiUrl}/uploadCover`, fd, { reportProgress: true });

    // cancel previous upload if exists
    if (this.coverSub) { this.coverSub.unsubscribe(); this.coverSub = null; }

    this.coverState = 'uploading';
    this.coverProgress = 0;

    this.coverSub = this.http.request(req).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const p = Math.round(100 * (event.loaded / event.total));
          this.ngZone.run(() => { this.coverProgress = p; this.cd.markForCheck(); });
        } else if (event instanceof HttpResponse) {
          const body = event.body as any;
          // expect { url: "..." } from server
          this.ngZone.run(() => {
            this.coverUrl = body?.url ?? null;
            this.coverState = this.coverUrl ? 'uploaded' : 'error';
            this.cd.markForCheck();
          });
        }
      },
      error: (err) => {
        console.error('Cover upload error', err);
        this.ngZone.run(() => { this.coverState = 'error'; this.coverProgress = 0; this.cd.markForCheck(); });
      },
      complete: () => { this.coverSub = null; }
    });
  }

  cancelCoverUpload() {
    if (this.coverSub) {
      this.coverSub.unsubscribe();
      this.coverSub = null;
    }
    this.coverState = 'idle';
    this.coverFile = null;
    this.coverPreview = null;
    this.coverUrl = null;
    this.coverProgress = 0;
    this.cd.markForCheck();
  }

  retryCoverUpload() {
    if (this.coverFile) this.startCoverUpload(this.coverFile);
  }

  removeCover() {
    // Optionally: call server to delete temporary uploaded file if you want
    this.cancelCoverUpload();
  }

  // ---------- GALLERY HANDLERS ----------
  onGallerySelect(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    this.addGalleryFiles(files);
    (event.target as HTMLInputElement).value = '';
  }

  onGalleryDrop(ev: DragEvent) {
    ev.preventDefault();
    const files = Array.from(ev.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    this.addGalleryFiles(files);
  }

  private addGalleryFiles(files: File[]) {
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const preview: GalleryPreview = {
        src: '',
        progress: 0,
        state: 'selected',
        url: null,
        sub: null,
        file
      };
      this.gallery.push(preview);
      const idx = this.gallery.length - 1;
      // immediate preview
      const r = new FileReader();
      r.onload = () => this.ngZone.run(() => { this.gallery[idx].src = r.result as string; this.gallery[idx].state = 'uploading'; this.cd.markForCheck(); });
      r.readAsDataURL(file);
      // start upload
      this.uploadGalleryItem(idx);
    });
    this.cd.markForCheck();
  }

  private uploadGalleryItem(index: number) {
    const item = this.gallery[index];
    if (!item?.file) return;

    const fd = new FormData();
    fd.append('gallery', item.file);

    const req = new HttpRequest('POST', `${this.apiUrl}/uploadGallery`, fd, { reportProgress: true });

    item.sub?.unsubscribe();
    item.sub = this.http.request(req).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const p = Math.round(100 * (event.loaded / event.total));
          this.ngZone.run(() => {
            item.progress = p;
            this.cd.markForCheck();
          });
        }
        else if (event instanceof HttpResponse) {
          const body = event.body as any;
          console.log('upload result:', body);

          this.ngZone.run(() => {
            // ✅ استخراج درست URL از آرایه urls
            item.url = Array.isArray(body?.urls) && body.urls.length > 0 ? body.urls[0] : null;

            // ✅ تعیین حالت بر اساس وجود URL
            item.state = item.url ? 'uploaded' : 'error';
            item.sub = null;

            this.cd.markForCheck();
          });
        }
      },
      error: (err) => {
        console.error('Gallery upload error', err);
        this.ngZone.run(() => {
          item.url = null;
          item.state = 'error';
          item.sub = null;
          this.cd.markForCheck();
        });
      }
    });
  }

  cancelGalleryUpload(index: number) {
    const item = this.gallery[index];
    item?.sub?.unsubscribe();
    item.sub = null;
    item.state = 'idle';
    item.progress = 0;
    item.url = null;
    this.cd.markForCheck();
  }

  retryGalleryUpload(index: number) {
    const item = this.gallery[index];
    if (!item?.file) return;
    item.state = 'uploading';
    item.progress = 0;
    this.uploadGalleryItem(index);
  }

  removeGalleryImage(index: number) {
    const item = this.gallery[index];
    item?.sub?.unsubscribe();
    this.gallery.splice(index, 1);
    this.cd.markForCheck();
  }

  resetGallery() {
    this.gallery.forEach(it => it.sub?.unsubscribe());
    this.gallery = [];
    this.cd.markForCheck();
  }

  // ---------- SUBMIT ----------
  submitProject() {
    // ensure required fields
    if (!this.title || !this.endpoint_Path || !this.content) {
      this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'لطفاً فیلدهای ضروری را پر کنید.' } });
      return;
    }

    // collect gallery URLs of uploaded items
    const galleryUrls = this.gallery.map(g => g.url).filter(u => !!u) as string[];

    const body = {
      Title: this.title,
      Endpoint_Path: this.endpoint_Path,
      CoverImageUrl: this.coverUrl,
      Description: this.description,
      Content: this.content,
      StartDate: this.startDate,
      EndDate: this.endDate,
      Location: this.location,
      Owner: this.owner,
      Gallery: galleryUrls
    };

    this.http.post(`${this.apiUrl}/create`, body).subscribe({
      next: () => {
        this.dialog.open(MessageDialogComponent, { data: { title: 'موفق', message: 'پروژه با موفقیت ثبت شد.' } });
        // reset
        this.resetForm();
      },
      error: (err) => {
        console.error('Create project error', err);
        this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'ثبت پروژه انجام نشد.' } });
      }
    });
  }

  resetForm() {
    this.title = '';
    this.endpoint_Path = '';
    this.description = '';
    this.content = '';
    this.startDate = null;
    this.endDate = null;
    this.location = '';
    this.owner = '';
    // cover
    this.cancelCoverUpload();
    // gallery
    this.resetGallery();
    this.cd.markForCheck();
  }
}
