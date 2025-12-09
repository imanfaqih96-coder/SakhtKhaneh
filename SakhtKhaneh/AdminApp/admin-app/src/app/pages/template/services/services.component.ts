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

export interface serviceItem {
  id: string | null;
  iconUrl: string;
  title: string;
  description: string | null;
  creationDate: Date | null;
  lastUpdateDate: Date | null;
}

export interface serviceIconItem {
  iconUrl: string;
  title: string;
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
    NgxEditorModule,
    MatNativeDateModule,
    MatDatepickerModule
  ],
  templateUrl: './services.html',
  styleUrls: ['./services.css']
})

export class ServicesComponent implements OnInit, AfterViewInit {

  private apiUrl = `${window.location.origin}/api`;

  // Form initialization

  newServiceTitle: string = '';
  newServiceDescription: string = '';
  newServiceIcon: serviceIconItem | null = null;

  editServiceId: string | undefined | null = '';
  editServiceIcon: serviceIconItem | null = null;
  editServiceTitle: string | undefined = '';
  editServiceDescription: string | null | undefined = '';

  services: serviceItem[] = [];
  servicesIcons: serviceIconItem[] = [];

  creationServiceFlag: boolean = false;
  customizingServiceFlag: boolean = false;

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

  // -------------[ SUBMIT ]----------------

  openCreationServiceCard() {
    this.creationServiceFlag = true;
    this.cd.detectChanges();
  }

  setServiceForEdit(item_id: string | null) {

    this.customizingServiceFlag = true;

    var targetService = null;
    var targetIcon = null;

    for (var i = 0; i < this.services.length; i++) {
      var item = this.services[i];
      if (item.id == item_id) {
        targetService = item;
      }
    }

    for (var i = 0; i < this.servicesIcons.length; i++) {
      var current = this.servicesIcons[i];
      if (current.iconUrl == targetService?.iconUrl) {
        targetIcon = current;
      }
    }

    this.editServiceTitle = targetService?.title;
    this.editServiceId = targetService?.id;
    this.editServiceDescription = targetService?.description;
    this.editServiceIcon = targetIcon;

    console.log('target icon:', targetIcon);

    this.cd.detectChanges();

  }

  addNewService() {
    //create logic
    var dto = {
      title: this.newServiceTitle,
      description: this.newServiceDescription,
      iconUrl: this.newServiceIcon?.iconUrl
    }
    console.log('attempt to upload to create:', dto);
    this.http.post(`${this.apiUrl}/services/create`, dto).subscribe({
      next: (res: any) => {
        if (res.status == 'success') {
          this.dialog.open(MessageDialogComponent, { data: { title: 'موفق', message: 'خدمات جدید افزوده شد.' } });
          this.initServices();
          this.cancelNewService();
        }
      },
      error: (err) => {
        console.warn('error creating service:', err);
      }
    })
    // apply and close
    this.creationServiceFlag = false;
    this.cd.detectChanges();
  }

  saveServiceChanges() {
    // save logic
    var dto = {
      id: this.editServiceId,
      title: this.editServiceTitle,
      description: this.editServiceDescription,
      iconUrl: this.editServiceIcon?.iconUrl
    }
    this.http.post(`${this.apiUrl}/services/edit`, dto).subscribe({
      next: (res: any) => {
        this.dialog.open(MessageDialogComponent, { data: { title: 'موفق', message: 'خدمات بروزرسانی شد.' } });
        this.initServices();
        this.cancelEditService();
      },
      error: (err) => {
        console.warn('error saving the selected service:', err);
      }
    })
    // apply and close
    this.customizingServiceFlag = false;
    this.cd.detectChanges();
  }

  cancelNewService() {
    this.newServiceTitle = '';
    this.newServiceDescription = '';
    this.newServiceIcon = null;
    this.creationServiceFlag = false;
    this.cd.detectChanges();
  }

  cancelEditService() {
    this.editServiceTitle = '';
    this.editServiceDescription = '';
    this.editServiceIcon = null;
    this.customizingServiceFlag = false;
    this.cd.detectChanges();
  }

  initIcons() {
    this.http.get(`${this.apiUrl}/template/icons/services/get`).subscribe({
      next: (res: any) => {
        var icons = res;
        console.log('icons:', icons);
        this.servicesIcons = icons;
      },
      error: (err) => {
        console.warn('error initating icons:', err);
      }
    });
  }

  initServices() {
    this.http.get(`${this.apiUrl}/services/get`).subscribe({
      next: (res: any) => {
        var status = res.status;

        if (status == 'success') {
          var data = JSON.parse(res.message);
          this.services = data;
          this.cd.detectChanges();
        }
        else {
          console.warn('error initalizing services:', res.message);
        }

      }
    })
  }

  loadForm() {
    // initialize the data
    this.initIcons();
    this.initServices();
  }

}
