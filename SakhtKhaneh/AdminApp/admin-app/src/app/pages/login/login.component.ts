import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(private auth: AuthService, private router: Router) {
  }

  login() {
    this.auth.login(this.username, this.password).subscribe({
      next: (res: any) => {
        // رفتار بعد از ورود موفق
        console.log(res);

        if (res === 'success') {
          localStorage.setItem('auth_user', this.username);
          this.router.navigate(['/dashboard']);
        }
        else {
          // نمایش پیام سرور
          this.message = res.message || 'خطا در ورود';
        }

      },
      error: (err: any) => {
        this.message = 'خطا در ورود';
      },
    });
  }
}
