import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  styleUrls: ['./login.css', '../../../styles.css']
})
export class LoginComponent {
  username = '';
  password = '';
  message = '';
  loading = false;
  hidePassword = true;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  login(): void {
    this.message = '';
    if (!this.username.trim() || !this.password) {
      this.message = 'نام کاربری و رمز عبور را وارد کنید.';
      return;
    }

    this.loading = true;
    this.auth.login(this.username.trim(), this.password)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => {
          if (response.status !== 'success') {
            this.message = response.message || 'ورود انجام نشد.';
            return;
          }

          if (response.mustChangePassword) {
            void this.router.navigate(['/profile'], { queryParams: { required: 'password' } });
            return;
          }

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard');
        },
        error: error => {
          this.message = error?.error?.message
            ?? (error.status === 429 ? 'تعداد تلاش‌ها زیاد است؛ چند دقیقه بعد دوباره امتحان کنید.' : 'نام کاربری یا رمز عبور صحیح نیست.');
        }
      });
  }
}
