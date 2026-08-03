import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
})
export class RegisterComponent {
  username: string = '';
  password: string = '';
  email: string = '';
  message: string = '';

  constructor(private auth: AuthService, private router: Router) {
  }

  register() {
    this.auth.register(this.username, this.password, this.email).subscribe({
      next: (res: any) => {
        console.log(res);
        this.router.navigate(['/login']); // بعد ثبت نام بره login
      },
      error: (err: any) => {
        this.message = 'خطا در ثبت نام';
      },
    });
  }
}
