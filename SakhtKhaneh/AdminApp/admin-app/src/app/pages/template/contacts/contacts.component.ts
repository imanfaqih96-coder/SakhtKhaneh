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
import { email } from '@angular/forms/signals';

type UploadState = 'idle' | 'selected' | 'uploading' | 'uploaded' | 'error';

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
    NgxEditorModule,
    MatNativeDateModule,
    MatDatepickerModule
  ],
  templateUrl: './contacts.html',
  styleUrls: ['./contacts.css']
})

export class ContactsComponent implements OnInit, AfterViewInit {

  private apiUrl = `${window.location.origin}/api`;

  // Form initialization

  description: string | null = null;
  content: string = '';

  phone: string | null = null;
  email: string | null = null;
  address: string | null = null;

  descriptionTemplateRow: object | null | undefined = null;
  contentTemplateRow: object | null | undefined = null;
  phoneTemplateRow: object | null | undefined = null;
  emailTemplateRow: object | null | undefined = null;
  addressTemplateRow: object | null | undefined = null;

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

  // ------------------------------------------------
  // 🔧 Helper → Load any key from backend
  // ------------------------------------------------
  private loadField(path: string, key: string, assign: (value: any) => void): void {
    this.http.post(`${this.apiUrl}/template/get`, { path, key }).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          const data = JSON.parse(res.message);
          if (data) assign(data);
        }
      },
      error: (err) => console.warn(`error loading '${key}':`, err)
    });
  }

  private convertEntity(data: any) {
    var converted = {
      id: data?.Id ?? null,
      path: data?.Path ?? 'contacts',
      key: data?.Key,
      value: data?.Value
    }
    return converted;
  }

  private obtainUpdatedDatabaseObject(key: string) {
    if (key == 'description') {
      var obj = this.convertEntity(this.descriptionTemplateRow);
      obj.key = key;
      obj.value = this.description ?? '';
      return obj;
    }
    else if (key == 'content') {
      var obj = this.convertEntity(this.contentTemplateRow);
      obj.key = key;
      obj.value = this.content ?? '';
      return obj;
    }
    else if (key == 'phone') {
      var obj = this.convertEntity(this.phoneTemplateRow);
      obj.key = key;
      obj.value = this.phone ?? '';
      return obj;
    }
    else if (key == 'email') {
      var obj = this.convertEntity(this.emailTemplateRow);
      obj.key = key;
      obj.value = this.email ?? '';
      return obj;
    }
    else if (key == 'address') {
      var obj = this.convertEntity(this.addressTemplateRow);
      obj.key = key;
      obj.value = this.address ?? '';
      return obj;
    }
    else {
      return null;
    }
  }

  // ------------------ [ FORM ] ---------------------

  // ------------------ LOAD FORM ------------------
  loadForm() {
    this.loadField('contacts', 'description', (data) => {
      this.description = data.Value;
      this.descriptionTemplateRow = data;
    });
    this.loadField('contacts', 'content', (data) => {
      this.content = data.Value;
      this.contentTemplateRow = data;
    });
    this.loadField('contacts', 'phone', (data) => {
      this.phone = data.Value;
      this.phoneTemplateRow = data;
    });
    this.loadField('contacts', 'email', (data) => {
      this.email = data.Value;
      this.emailTemplateRow = data;
    });
    this.loadField('contacts', 'address', (data) => {
      this.address = data.Value;
      this.addressTemplateRow = data;
    });
  }

  saveChanges() {

    this.cd.detectChanges();

    console.log('content value:', this.content);

    var properties = [];

    var descriptionObject = this.obtainUpdatedDatabaseObject('description');
    var contentObject = this.obtainUpdatedDatabaseObject('content');
    var phoneObject = this.obtainUpdatedDatabaseObject('phone');
    var emailObject = this.obtainUpdatedDatabaseObject('email');
    var addressObject = this.obtainUpdatedDatabaseObject('address');

    properties.push(descriptionObject);
    properties.push(contentObject);
    properties.push(phoneObject);
    properties.push(emailObject);
    properties.push(addressObject);

    console.log('attempting to save properties:', properties);

    this.http.post(`${this.apiUrl}/template/set-multiple`, properties).subscribe({
      next: (res: any) => {
        if (res.status == 'success') {
          this.dialog.open(MessageDialogComponent, { data: { title: 'موفق', message: 'تغییرات بروزرسانی شد.' } });
        }
        else {
          this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'خطا در بروزرسانی مقادیر.' } });
        }
        this.cd.detectChanges();
      },
      error: (err) => {
        this.dialog.open(MessageDialogComponent, { data: { title: 'خطا', message: 'خطای پیش بینی نشده در بروزرسانی مقادیر.' } });
        console.warn('error submiting changes as below:', err);
      }
    })

  }
}

