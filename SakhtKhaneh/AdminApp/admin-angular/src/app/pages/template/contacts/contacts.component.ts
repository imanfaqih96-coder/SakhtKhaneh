import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, finalize } from 'rxjs';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MessageDialogComponent } from '../../components/message/message-dialog.component';

interface TemplateEntity {
  Id?: string;
  Path?: string;
  Key?: string;
  Value?: string;
}

interface SocialLinkItem {
  id?: string;
  platform: string;
  title: string;
  url: string;
  username?: string | null;
  iconName?: string | null;
  sortOrder: number;
  isVisible: boolean;
}

@Component({
  selector: 'edit-contacts',
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
    MatSlideToggleModule,
    MatDialogModule,
    NgxEditorModule
  ],
  templateUrl: './contacts.html',
  styleUrls: ['./contacts.css']
})
export class ContactsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly apiUrl = `${window.location.origin}/api`;

  description = '';
  content = '';
  phone = '';
  email = '';
  address = '';
  loading = false;
  saving = false;
  socialLinks: SocialLinkItem[] = [];

  private rows: Record<string, TemplateEntity | null> = {
    description: null,
    content: null,
    phone: null,
    email: null,
    address: null
  };

  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    ['link'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify']
  ];

  readonly platforms = [
    { value: 'instagram', label: 'اینستاگرام', hint: 'نام کاربری یا لینک کامل' },
    { value: 'telegram', label: 'تلگرام', hint: 'نام کاربری یا لینک کامل' },
    { value: 'whatsapp', label: 'واتساپ', hint: 'شماره با کد کشور یا لینک کامل' },
    { value: 'linkedin', label: 'لینکدین', hint: 'نام کاربری یا لینک کامل' },
    { value: 'youtube', label: 'یوتیوب', hint: 'نام کانال یا لینک کامل' },
    { value: 'aparat', label: 'آپارات', hint: 'نام کاربری یا لینک کامل' },
    { value: 'x', label: 'ایکس (توییتر)', hint: 'نام کاربری یا لینک کامل' },
    { value: 'facebook', label: 'فیسبوک', hint: 'نام کاربری یا لینک کامل' },
    { value: 'pinterest', label: 'پینترست', hint: 'نام کاربری یا لینک کامل' },
    { value: 'custom', label: 'شبکه یا لینک سفارشی', hint: 'لینک کامل الزامی است' }
  ];

  constructor(
    private readonly http: HttpClient,
    private readonly cd: ChangeDetectorRef,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.editor = new Editor();
  }

  ngAfterViewInit(): void {
    this.loadForm();
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  addSocial(): void {
    const nextOrder = this.socialLinks.length
      ? Math.max(...this.socialLinks.map(item => item.sortOrder)) + 1
      : 0;
    this.socialLinks.push({
      platform: 'instagram',
      title: 'اینستاگرام',
      username: '',
      url: '',
      sortOrder: nextOrder,
      isVisible: true
    });
  }

  removeSocial(index: number): void {
    this.socialLinks.splice(index, 1);
    this.reindexSocials();
  }

  moveSocial(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.socialLinks.length) return;
    [this.socialLinks[index], this.socialLinks[target]] = [this.socialLinks[target], this.socialLinks[index]];
    this.reindexSocials();
  }

  platformChanged(item: SocialLinkItem): void {
    const platform = this.platforms.find(option => option.value === item.platform);
    if (platform && (!item.title || this.platforms.some(option => option.label === item.title))) {
      item.title = platform.label;
    }
  }

  platformHint(item: SocialLinkItem): string {
    return this.platforms.find(option => option.value === item.platform)?.hint ?? 'لینک کامل';
  }

  saveChanges(): void {
    if (this.saving) return;
    const invalidSocial = this.socialLinks.find(item => !item.title.trim() || (!item.url.trim() && !(item.username ?? '').trim()));
    if (invalidSocial) {
      this.show('اطلاعات ناقص', 'برای هر شبکه اجتماعی عنوان و نام کاربری یا لینک را وارد کنید.');
      return;
    }

    this.saving = true;
    const properties = ['description', 'content', 'phone', 'email', 'address']
      .map(key => this.updatedRow(key));

    const links = this.socialLinks.map((item, index) => ({
      ...item,
      sortOrder: index,
      username: item.username?.trim() || null,
      url: item.url.trim()
    }));

    forkJoin({
      template: this.http.post<any>(`${this.apiUrl}/template/set-multiple`, properties),
      social: this.http.post<any>(`${this.apiUrl}/social-links/save`, links)
    })
      .pipe(finalize(() => {
        this.saving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.show('ذخیره شد', 'اطلاعات تماس و شبکه‌های اجتماعی با موفقیت بروزرسانی شدند.');
          this.loadForm();
        },
        error: error => this.show('خطا', error?.error?.message ?? 'ذخیره اطلاعات انجام نشد.')
      });
  }

  private loadForm(): void {
    this.loading = true;
    const keys = ['description', 'content', 'phone', 'email', 'address'] as const;

    forkJoin({
      description: this.loadTemplateRow('description'),
      content: this.loadTemplateRow('content'),
      phone: this.loadTemplateRow('phone'),
      email: this.loadTemplateRow('email'),
      address: this.loadTemplateRow('address'),
      socialLinks: this.http.get<SocialLinkItem[]>(`${this.apiUrl}/social-links/get`)
    })
      .pipe(finalize(() => {
        this.loading = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: (result: any) => {
          for (const key of keys) this.applyTemplateResponse(key, result[key]);
          this.socialLinks = (result.socialLinks ?? []).map((item: SocialLinkItem, index: number) => ({
            ...item,
            url: item.url ?? '',
            username: item.username ?? '',
            sortOrder: item.sortOrder ?? index,
            isVisible: item.isVisible !== false
          }));
          this.cd.detectChanges();
        },
        error: error => {
          console.error('Failed to load contacts', error);
          this.show('خطا', 'دریافت اطلاعات تماس انجام نشد.');
        }
      });
  }


  private loadTemplateRow(key: string) {
    return this.http.post<any>(`${this.apiUrl}/template/get`, { path: 'contacts', key });
  }

  private applyTemplateResponse(key: string, response: any): void {
    if (response?.status !== 'success' || !response.message) return;
    try {
      const entity = JSON.parse(response.message) as TemplateEntity;
      this.rows[key] = entity;
      (this as any)[key] = entity.Value ?? '';
    } catch (error) {
      console.warn(`Invalid template response for ${key}`, error);
    }
  }

  private updatedRow(key: string): { id: string | null; path: string; key: string; value: string } {
    const current = this.rows[key];
    return {
      id: current?.Id ?? null,
      path: current?.Path ?? 'contacts',
      key,
      value: String((this as any)[key] ?? '')
    };
  }

  private reindexSocials(): void {
    this.socialLinks.forEach((item, index) => item.sortOrder = index);
  }

  private show(title: string, message: string): void {
    this.dialog.open(MessageDialogComponent, { data: { title, message } });
  }
}
