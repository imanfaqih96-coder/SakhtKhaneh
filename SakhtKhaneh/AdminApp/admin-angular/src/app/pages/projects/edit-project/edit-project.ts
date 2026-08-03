import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { finalize, Subscription } from 'rxjs';

// Angular Material modules are imported in the component `imports` array (standalone)
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';

// Local dialog (you already have MessageDialogComponent)
import { MessageDialogComponent } from '../../components/message/message-dialog.component';

import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';


type UploadState = 'idle' | 'selected' | 'uploading' | 'uploaded' | 'error';

interface ProjectCategoryOption { id: string; parentId?: string | null; title: string; slug: string; }

interface GalleryPreview {
  src: string;             // base64 / object url for preview
  progress: number;        // 0..100
  state: UploadState;      // uploading/uploaded/error
  url?: string | null;     // final server URL after upload
  sub?: Subscription | null; // subscription to cancel
  file?: File;             // original file reference
}

interface messageResponse {
  status: string;
  message: string;
}

interface GalleryItem {
  id: string;
  projectId: string;
  imageUrl: string;
}

@Component({
  selector: 'edit-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgIf,
    NgFor,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatDialogModule,
    MatSelectModule,
    NgxEditorModule
  ],
  templateUrl: './edit-project.html',
  styleUrls: ['./edit-project.css']
})
export class EditProjectComponent implements OnInit, OnDestroy {

  apiUrl = window.location.origin + "/api/projects";
  projectId: string = "";

  // form fields
  id = '';
  endpoint_Path = '';
  title = '';
  description = '';
  content = '';
  time = '';
  location = '';
  owner = '';
  seoTitle = '';
  metaDescription = '';
  coverImageAlt = '';
  categoryId: string | null = null;
  status = 2;
  categories: ProjectCategoryOption[] = [];
  loading = true;
  saving = false;
  readonly statusOptions = [
    { value: 0, title: 'در دست طراحی' },
    { value: 1, title: 'در دست ساخت' },
    { value: 2, title: 'تکمیل‌شده' }
  ];

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
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.editor = new Editor();
    this.projectId = this.route.snapshot.params['project_guid'];
    this.loadCategories();
    this.loadProject();
  }

  categoryLabel(category: ProjectCategoryOption): string {
    let depth = 0;
    let parentId = category.parentId ?? null;
    const visited = new Set<string>();
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = this.categories.find(item => item.id === parentId);
      if (!parent) break;
      depth += 1;
      parentId = parent.parentId ?? null;
    }
    return `${'— '.repeat(depth)}${category.title}`;
  }

  ngOnDestroy(): void {
    this.coverSub?.unsubscribe();
    this.gallery.forEach(item => item.sub?.unsubscribe());
    this.editor?.destroy();
  }


  private loadCategories(): void {
    this.http.get<ProjectCategoryOption[]>(`${window.location.origin}/api/project-categories/flat`).subscribe({
      next: items => { this.categories = items ?? []; this.cd.detectChanges(); },
      error: () => this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'دریافت دسته‌بندی‌های پروژه انجام نشد.' } })
    });
  }

  // =======================================================
  // LOAD PROJECT
  // =======================================================
  loadProject(): void {
    if (!this.projectId) {
      this.loading = false;
      this.showMessage('خطا', 'شناسه پروژه نامعتبر است.');
      void this.router.navigate(['/projects/all']);
      return;
    }

    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/get/${this.projectId}`)
      .pipe(finalize(() => {
        this.loading = false;
        this.cd.markForCheck();
      }))
      .subscribe({
        next: project => {
          this.id = project.id ?? this.projectId;
          this.title = project.title ?? '';
          this.endpoint_Path = project.endpoint_Path ?? '';
          this.description = project.description ?? '';
          this.content = project.content ?? '';
          this.location = project.location ?? '';
          this.owner = project.owner ?? '';
          this.time = project.time ?? '';
          this.seoTitle = project.seoTitle ?? '';
          this.metaDescription = project.metaDescription ?? '';
          this.coverImageAlt = project.coverImageAlt ?? '';
          this.categoryId = project.categoryId ?? null;
          this.status = Number.isInteger(project.status) ? project.status : 2;

          this.coverUrl = project.coverImageUrl ?? null;
          this.coverPreview = null;
          this.coverProgress = this.coverUrl ? 100 : 0;
          this.coverState = this.coverUrl ? 'uploaded' : 'idle';

          this.gallery = Array.isArray(project.gallery)
            ? project.gallery
                .map((item: GalleryItem): GalleryPreview => ({
                  src: item.imageUrl,
                  url: item.imageUrl,
                  progress: 100,
                  state: 'uploaded',
                  sub: null
                }))
                .filter((item: GalleryPreview) => !!item.url)
            : [];

          this.cd.markForCheck();
        },
        error: error => {
          this.showMessage('دریافت پروژه انجام نشد', this.readErrorMessage(error));
          void this.router.navigate(['/projects/all']);
        }
      });
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
            item.state = 'uploaded';
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


  // =======================================================
  // SUBMIT UPDATE
  // =======================================================
  saveChanges(): void {
    const title = this.title.trim();
    const endpoint = this.endpoint_Path.trim();
    const content = this.content.trim();

    if (!title || !endpoint || !content) {
      this.showMessage('اطلاعات ناقص', 'عنوان، مسیر انگلیسی و محتوای پروژه الزامی هستند.');
      return;
    }

    if (!this.coverUrl || this.coverState !== 'uploaded') {
      this.showMessage('تصویر کاور', 'پروژه باید یک تصویر کاور معتبر داشته باشد.');
      return;
    }

    if (this.hasPendingGalleryUploads()) {
      this.showMessage('آپلود تصاویر', 'پیش از ذخیره تغییرات، منتظر پایان آپلود تمام تصاویر گالری بمانید.');
      return;
    }

    const gallery = this.gallery
      .filter(item => item.state === 'uploaded' && !!item.url)
      .map(item => ({ url: item.url as string }));

    const payload = {
      id: this.projectId,
      endpoint_Path: endpoint,
      title,
      description: this.description.trim(),
      content,
      location: this.location.trim(),
      owner: this.owner.trim(),
      coverImageUrl: this.coverUrl,
      seoTitle: this.seoTitle.trim(),
      metaDescription: this.metaDescription.trim(),
      coverImageAlt: this.coverImageAlt.trim() || title,
      categoryId: this.categoryId || null,
      status: this.status,
      gallery,
      time: this.time.trim()
    };

    this.saving = true;
    this.http.post<messageResponse>(`${this.apiUrl}/update`, payload)
      .pipe(finalize(() => {
        this.saving = false;
        this.cd.markForCheck();
      }))
      .subscribe({
        next: response => {
          if (response.status === 'fail') {
            const message = response.message === 'path-already-exists'
              ? 'این مسیر انگلیسی قبلاً برای پروژه دیگری استفاده شده است.'
              : response.message;
            this.showMessage('به‌روزرسانی انجام نشد', message);
            return;
          }

          this.showMessage('موفق', response.message || 'پروژه با موفقیت به‌روزرسانی شد.');
          void this.router.navigate(['/projects/all']);
        },
        error: error => this.showMessage('خطا در به‌روزرسانی پروژه', this.readErrorMessage(error))
      });
  }

  hasPendingGalleryUploads(): boolean {
    return this.gallery.some(item => item.state === 'uploading' || item.state === 'selected');
  }

  private readErrorMessage(error: any): string {
    const message = error?.error?.message;
    if (message === 'path-already-exists')
      return 'این مسیر انگلیسی قبلاً برای پروژه دیگری استفاده شده است.';

    if (error?.status === 404)
      return 'پروژه پیدا نشد یا قبلاً حذف شده است.';

    return typeof message === 'string' && message.trim()
      ? message
      : 'به‌روزرسانی پروژه انجام نشد. گزارش سرور را برای کد پیگیری بررسی کنید.';
  }

  private showMessage(title: string, message: string): void {
    this.dialog.open(MessageDialogComponent, { data: { title, message } });
  }

}
