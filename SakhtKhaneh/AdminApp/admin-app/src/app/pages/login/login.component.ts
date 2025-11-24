import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  message: string = '';

  constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
  }

  login() {
    this.auth.login(this.username, this.password).subscribe({
      next: (res: any) => {
        console.log("SERVER RESPONSE:", res);

        if (res.status === 'success') {
          localStorage.setItem('auth_user', this.username);
          this.router.navigate(['/dashboard']);
        }
        else if (res.status === 'fail') {
          this.message = res.message;
          this.cdr.detectChanges();
        }
        else if (res.status === 'pending') {
          this.message = res.message;
          this.cdr.detectChanges();
        }
        else {
          this.message = "خطای ناشناخته";
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.log("HTTP ERROR:", err);
        this.message = 'خطا در ارتباط با سرور';
        this.cdr.detectChanges();
      }
    });
  }

}
