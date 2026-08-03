import { Component, AfterViewInit, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

// Angular Material modules are imported in the component `imports` array (standalone)
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Local dialog (you already have MessageDialogComponent)
import { MessageDialogComponent } from '../../components/message/message-dialog.component';

type UploadState = 'idle' | 'selected' | 'uploading' | 'uploaded' | 'error';

interface GalleryPreview {
  src: string;             // base64 / object url for preview
  progress: number;        // 0..100
  state: UploadState | string;      // uploading/uploaded/error
  url?: string | null;     // final server URL after upload
  sub?: Subscription | null; // subscription to cancel
  file?: File;             // original file reference
}

@Component({
  selector: 'edit-services',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    MatNativeDateModule,
    MatDatepickerModule
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})

export class HomeManagementComponent implements OnInit, AfterViewInit {

  private apiUrl = `${window.location.origin}/api`;

  // Form initialization
  slider_items: GalleryPreview[] = [];

  // Gallery uploader (multiple)
  gallery: GalleryPreview[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog,

  ) { }

  ngOnInit(): void {
    // ✅ initialize
  }

  ngAfterViewInit(): void {
    // ensure initial CD
    this.loadForm();
    this.cd.detectChanges();
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

    const req = new HttpRequest('POST', `${this.apiUrl}/projects/uploadGallery`, fd, { reportProgress: true });

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

  onDragOver(ev: DragEvent) { ev.preventDefault(); }

  resetGallery() {
    this.gallery.forEach(it => it.sub?.unsubscribe());
    this.gallery = [];
    this.cd.markForCheck();
  }

  // ------------------ [ FORM ] ---------------------
  loadForm() {
    this.initSlider();
  }

  saveSliderChanges() {
    this.cd.detectChanges();
    var slider_items = this.gallery;
    if (slider_items && slider_items?.length) {
      var arr = [];
      for (var i = 0; i < slider_items.length; i++) {
        var item = slider_items[i];
        console.log('slider item:', item);
        var url = item.url;
        arr.push(url);
      }
      this.http.post(`${this.apiUrl}/template/saveHomeSliderSettings`, arr).subscribe({
        next: (response: any) => {
          if (response.status == 'success') {
            this.dialog.open(MessageDialogComponent, { data: { title: 'موفق', message: 'تغییرات با موفقیت بارگذاری شد' } });
          }
          else {
            this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'خطا در ثبت اطلاعات اسلایدر صفحه اصلی.' } });
          }

          this.cd.detectChanges();

        },
        error: (error) => {
          console.warn('error during the submit of the home slider items changes:', error);
        }
      })
    }
  }

  initSlider() {
    this.http.post(`${this.apiUrl}/template/get-multiple`, { path: 'home', key: 'slider-item' }).subscribe({
      next: (response: any) => {
        if (response.status == 'success') {
          //slider items
          var sliderItems = JSON.parse(response.message);
          if (sliderItems && sliderItems?.length) {

            this.slider_items = [];

            for (var i = 0; i < sliderItems.length; i++) {
              var sliderItem = sliderItems[i];
              var current = {
                src: sliderItem.Value,
                url: sliderItem.Value,
                file: undefined,
                state: 'uploaded',
                sub: null,
                progress: 100
              };

              this.slider_items.push(current);
            }

            this.gallery = this.slider_items;
            console.log('gallery initialized as:', this.gallery);
            this.cd.detectChanges();
          }
          else {
            this.slider_items = [];
            this.gallery = this.slider_items;
            this.cd.detectChanges();
          }
        }
        else {
          this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'خطا در بارگذاری اطلاعات اسلایدر صفحه اصلی.' } });
        }
      },
      error: (error) => {
        console.warn('error during the initialization of the home slider items from database:', error);
      }
    })
  }
}

