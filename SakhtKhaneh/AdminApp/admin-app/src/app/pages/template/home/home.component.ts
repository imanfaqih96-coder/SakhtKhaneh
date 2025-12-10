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
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})

export class HomeManagementComponent implements OnInit, AfterViewInit {

  private apiUrl = `${window.location.origin}/api`;

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


  // ------------------ [ FORM ] ---------------------
  loadForm() {

  }
}

