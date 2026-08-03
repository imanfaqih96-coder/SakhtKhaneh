import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { HttpEventType } from '@angular/common/http';
import {
  JournalGalleryItem,
  JournalItem,
  JournalsService
} from '../../../services/journals.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '../../components/message/message-dialog.component';

@Component({
  selector: 'app-journal-editor',
  standalone: true,
  templateUrl: './journal-editor.html',
  styleUrls: ['./journal-editor.css'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgxEditorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
  ]
})
export class JournalEditorComponent implements OnInit, OnDestroy {
  model: JournalItem = {
    endpointPath: '',
    title: '',
    description: '',
    imageUrl: '',
    imageAlt: '',
    tags: '',
    isPublished: true,
    gallery: []
  };

  editor = new Editor();
  toolbar: Toolbar = [
    ['bold', 'italic', 'underline'],
    ['ordered_list', 'bullet_list'],
    ['link'],
    ['align_left', 'align_center', 'align_right']
  ];

  loading = false;
  saving = false;
  uploadProgress = 0;
  uploading = false;
  id?: string;
  activePreview = 0;

  constructor(
    private readonly service: JournalsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('journal_id') ?? undefined;
    if (!this.id) return;

    this.loading = true;
    this.service.get(this.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: item => {
          this.model = this.service.normalize(item);
          this.activePreview = 0;
        },
        error: () => this.show('خطا', 'اطلاعات ژورنال دریافت نشد.')
      });
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;

    this.uploading = true;
    this.uploadProgress = 0;

    this.service.uploadMany(files)
      .pipe(finalize(() => this.uploading = false))
      .subscribe({
        next: eventData => {
          if (eventData.type === HttpEventType.UploadProgress && eventData.total) {
            this.uploadProgress = Math.round(eventData.loaded * 100 / eventData.total);
          }

          if (eventData.type === HttpEventType.Response) {
            const urls = eventData.body?.urls ?? [];
            const start = this.model.gallery.length;
            this.model.gallery = [
              ...this.model.gallery,
              ...urls.map((url, index): JournalGalleryItem => ({
                url,
                alt: this.model.title || `صفحه ${start + index + 1} ژورنال`,
                sortOrder: start + index
              }))
            ];
            this.syncCover();
            this.activePreview = start;
          }
        },
        error: error => this.show(
          'خطای آپلود',
          error?.error?.message ?? 'بارگذاری تصاویر انجام نشد.'
        )
      });
  }

  selectPreview(index: number): void {
    this.activePreview = index;
  }

  move(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.model.gallery.length) return;

    const gallery = [...this.model.gallery];
    [gallery[index], gallery[target]] = [gallery[target], gallery[index]];
    this.model.gallery = gallery.map((item, sortOrder) => ({ ...item, sortOrder }));
    this.activePreview = target;
    this.syncCover();
  }

  remove(index: number): void {
    this.model.gallery = this.model.gallery
      .filter((_, itemIndex) => itemIndex !== index)
      .map((item, sortOrder) => ({ ...item, sortOrder }));

    this.activePreview = Math.max(0, Math.min(this.activePreview, this.model.gallery.length - 1));
    this.syncCover();
  }

  save(): void {
    if (!this.model.title.trim() || !this.model.endpointPath.trim() || !this.model.description.trim() || !this.model.gallery.length) {
      this.show('اطلاعات ناقص', 'عنوان، مسیر، توضیحات و حداقل یک تصویر ژورنال الزامی هستند.');
      return;
    }

    this.syncCover();
    this.saving = true;
    const request = this.id
      ? this.service.update({ ...this.model, id: this.id })
      : this.service.create(this.model);

    request.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => {
        this.show('موفق', 'ژورنال با تمام صفحات تصویری ذخیره شد.');
        void this.router.navigate(['/journals/all']);
      },
      error: error => this.show(
        'خطا',
        error?.error?.message ?? 'ذخیره ژورنال انجام نشد.'
      )
    });
  }

  trackGallery(_: number, item: JournalGalleryItem): string {
    return item.id || item.url;
  }

  private syncCover(): void {
    const cover = this.model.gallery[0];
    this.model.imageUrl = cover?.url || '';
    this.model.imageAlt = cover?.alt || this.model.title;
  }

  private show(title: string, message: string): void {
    this.dialog.open(MessageDialogComponent, { data: { title, message } });
  }
}
