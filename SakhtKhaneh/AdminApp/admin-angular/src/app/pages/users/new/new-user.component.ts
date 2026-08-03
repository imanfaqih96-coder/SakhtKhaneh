import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { MessageDialogComponent } from '../../components/message/message-dialog.component';

// material imports
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'new-user',
  standalone: true,
  templateUrl: './new-user.html',
  styleUrls: ['./new-user.css'],
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ]
})

export class NewUserComponent implements AfterViewInit {

  private apiUrl = `${window.location.origin}/api`;

  userName = '';
  email = '';
  firstName = '';
  lastName = '';
  password = '';
  rePassword = '';

  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private dialog: MatDialog) { }
  ngAfterViewInit() {
    this.cd.detectChanges();
  }
  createUser() {
    //create user logic

    if (this.password == this.rePassword && (this.password != '')) {

      var authRequest = {
        UserName: this.userName,
        Email: this.email,
        Password: this.password,
        FirstName: this.firstName,
        LastName: this.lastName
      }

      this.http.post(`${this.apiUrl}/auth/register`, authRequest).subscribe((res: any) => {
        console.log(res);
        if (res.status == 'success') {
          this.dialog.open(MessageDialogComponent, {
            data: {
              title: 'موفق',
              message: res.message
            }
          });
        }
        else if (res.status == 'fail') {
          this.dialog.open(MessageDialogComponent, {
            data: {
              title: 'خطا',
              message: res.message
            }
          });
        }
        else {
          this.dialog.open(MessageDialogComponent, {
            data: {
              title: res.status,
              message: res.message
            }
          });
        }
      });

    }
    else {
      this.dialog.open(MessageDialogComponent, {
        data: {
          title: 'رمز عبور',
          message: 'رمز عبور وارد با تکرار آن برابر نیست'
        }
      });
    }

  }
}
