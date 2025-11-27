import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

// material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';


@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule
  ],
  styleUrls: ['./login.css', '../../../styles.css']
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
