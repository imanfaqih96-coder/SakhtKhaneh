import { Component, AfterViewInit, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';

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

@Component({
  selector: 'edit-about-us',
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
    NgxEditorModule,
    MatNativeDateModule,
    MatDatepickerModule
  ],
  templateUrl: './about.html',
  styleUrls: ['./about.css']
})

export class AboutUsComponent implements OnInit, AfterViewInit {

  private apiUrl = `${window.location.origin}/api`;

  // Form initialization
  title: string = '';
  content: string | null = '';

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

  // Cover uploader
  coverFile: File | null = null;
  coverPreview: string | null = null;   // immediate preview (dataURL)
  coverUrl: string | null = null;       // final server url
  coverProgress = 0;
  coverState: UploadState = 'idle';
  coverSub: Subscription | null = null;


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
    this.editor = new Editor();
  }

  ngAfterViewInit(): void {
    // ensure initial CD
    this.loadForm();
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

    const req = new HttpRequest('POST', `${this.apiUrl}/projects/uploadCover`, fd, { reportProgress: true });

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

  // -------- FORM HANDLERS ------------

  loadForm() {
    var target_property = {
      path: 'about',
      key: 'title'
    }

    this.http.post(`${this.apiUrl}/template/get`, target_property).subscribe({
      next: (res: any) => {
        if (res.status == 'success') {
          var data = JSON.parse(res.message);
          this.title = data.Value;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.warn('error during initiating the title:', err);
      }
    });

    target_property.key = 'content';

    this.http.post(`${this.apiUrl}/template/get`, target_property).subscribe({
      next: (res: any) => {
        if (res.status == 'success') {
          var data = JSON.parse(res.message);
          this.content = data.Value;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.warn('error during initiating the title:', err);
      }
    });

    target_property.key = 'image';

    this.http.post(`${this.apiUrl}/template/get`, target_property).subscribe({
      next: (res: any) => {
        if (res.status == 'success') {
          var data = JSON.parse(res.message);
          this.coverUrl = data.Value;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.warn('error during initiating the title:', err);
      }
    });

  }

  submitForm() {
    //submit logic
    var properties = [];
    // title property handling
    var title_property = {
      path: 'about',
      key: 'title',
      value: this.title
    }
    properties.push(title_property);
    // content property handling
    var content_property = {
      path: 'about',
      key: 'content',
      value: this.content
    }
    properties.push(content_property);
    // image property handling
    var image_property = {
      path: 'about',
      key: 'image',
      value: this.coverUrl
    }
    properties.push(image_property);

    this.http.post(`${this.apiUrl}/template/set-multiple`, properties).subscribe({
      next: (res: any) => {

        if (res.status == 'success') {
          this.dialog.open(MessageDialogComponent, { data: { title: 'موفق', message: 'بروزرسانی انجام شد.' } });

          this.cd.detectChanges();
        }
        else if (res.status == 'fail') {
          this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: ':خطایی در بروزرسانی رخ داده است. \n\n' + res.message } });
        }

      },
      error: (err) => {
        console.error('Update error', err);
        this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'خطای ناشناخته در بروزرسانی رخ داده است.' } });
      }
    });
  }

  resetForm() {
    //reset logic
  }

}
