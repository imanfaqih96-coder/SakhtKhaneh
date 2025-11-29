import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { ProfileService } from '../../services/profile.service';

import { MessageDialogComponent } from '../components/message/message-dialog.component';

// material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms'; // ✅ اضافه شد
import { MatDialog } from '@angular/material/dialog';

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
    FormsModule
  ]
})

export class ProfileComponent implements OnInit {

  firstName = '';
  lastName = '';
  email = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  profile = {
    userName: '',
    firstName: '',
    lastName: '',
    email: ''
  };

  constructor(private profileService: ProfileService, private cd: ChangeDetectorRef, private dialog: MatDialog) {
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
      this.firstName = res.firstName;
      this.lastName = res.lastName;
      this.email = res.email;
      this.cd.detectChanges();
    });
  }

  saveProfile() {
    const data = {
      userName: this.profile.userName,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email
    };

    this.profileService.updateProfile(data).subscribe(() => {

      this.dialog.open(MessageDialogComponent, {
        data: {
          title: 'موفق',
          message: '✅ اطلاعات ذخیره شد'
        }
      });

    });
  }

  updatePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.dialog.open(MessageDialogComponent, {
        data: {
          title: 'هشدار',
          message: '⚠️ رمز و تکرار آن یکسان نیست!'
        }
      });

      return;
    }

    const data = {
      CurrentPassword: this.currentPassword,
      NewPassword: this.newPassword
    };

    this.profileService.changePassword(data.CurrentPassword, data.NewPassword).subscribe(() => {
      this.dialog.open(MessageDialogComponent, {
        data: {
          title: 'موفق',
          message: '🔐 رمز عبور تغییر کرد'
        }
      });

    });
  }
}
