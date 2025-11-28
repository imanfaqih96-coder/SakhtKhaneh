import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { ProfileService } from '../../services/profile.service';

// material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms'; // ✅ اضافه شد

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule // ✅ اضافه شد
  ]
})

export class ProfileComponent implements OnInit {

  FirstName = '';
  LastName = '';
  Email = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  profile = {
    userName: '',
    firstName: '',
    lastName: '',
    email: ''
  };

  constructor(private profileService: ProfileService, private cd: ChangeDetectorRef) {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
      }

    });
  }

  ngOnInit() {
    this.profileService.getProfile().subscribe((res: any) => {
      this.FirstName = res.FirstName;
      this.LastName = res.LastName;
      this.Email = res.Email;
    });
  }

  saveProfile() {
    const data = {
      userName: this.profile.userName,
      firstName: this.FirstName,
      lastName: this.LastName,
      email: this.Email
    };

    this.profileService.updateProfile(data).subscribe(() => {
      alert('✅ اطلاعات ذخیره شد');
    });
  }

  updatePassword() {
    if (this.newPassword !== this.confirmPassword) {
      alert('⚠️ رمز و تکرار آن یکسان نیست!');
      return;
    }

    const data = {
      CurrentPassword: this.currentPassword,
      NewPassword: this.newPassword
    };

    this.profileService.changePassword(data.CurrentPassword, data.NewPassword).subscribe(() => {
      alert('🔐 رمز عبور تغییر کرد');
    });
  }
}
