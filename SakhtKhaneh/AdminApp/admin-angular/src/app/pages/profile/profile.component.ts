import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Profile, ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule]
})
export class ProfileComponent implements OnInit {
  profile: Profile = { userName: '', email: '', firstName: '', lastName: '', mustChangePassword: false };
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = true;
  savingProfile = false;
  changingPassword = false;
  profileMessage = '';
  passwordMessage = '';
  passwordError = '';
  hideCurrent = true;
  hideNew = true;

  constructor(
    private readonly profileService: ProfileService,
    private readonly auth: AuthService,
    private readonly router: Router,
    public readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.profileService.getProfile().pipe(finalize(() => this.loading = false)).subscribe({
      next: profile => this.profile = profile,
      error: () => this.profileMessage = 'دریافت اطلاعات حساب با خطا مواجه شد.'
    });
  }

  saveProfile(): void {
    this.profileMessage = '';
    this.savingProfile = true;
    this.profileService.updateProfile({
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      email: this.profile.email
    }).pipe(finalize(() => this.savingProfile = false)).subscribe({
      next: result => this.profileMessage = result.message || 'اطلاعات حساب ذخیره شد.',
      error: error => this.profileMessage = error?.error?.message ?? 'ذخیره اطلاعات انجام نشد.'
    });
  }

  updatePassword(): void {
    this.passwordMessage = '';
    this.passwordError = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'رمز جدید و تکرار آن یکسان نیست.';
      return;
    }
    if (!this.isStrongPassword(this.newPassword)) {
      this.passwordError = 'رمز باید حداقل ۱۰ کاراکتر و شامل حرف بزرگ، حرف کوچک، عدد و نماد باشد.';
      return;
    }

    this.changingPassword = true;
    this.profileService.changePassword(this.currentPassword, this.newPassword)
      .pipe(finalize(() => this.changingPassword = false))
      .subscribe({
        next: result => {
          this.passwordMessage = result.message || 'رمز عبور تغییر کرد.';
          this.profile.mustChangePassword = false;
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.auth.refreshSession().subscribe(() => {
            setTimeout(() => void this.router.navigate(['/dashboard']), 900);
          });
        },
        error: error => this.passwordError = error?.error?.message ?? this.readValidationError(error) ?? 'تغییر رمز انجام نشد.'
      });
  }

  private isStrongPassword(value: string): boolean {
    return value.length >= 10 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
  }

  private readValidationError(error: any): string | null {
    const errors = error?.error?.errors;
    if (!errors) return null;
    return Object.values(errors).flat().join(' | ');
  }
}
