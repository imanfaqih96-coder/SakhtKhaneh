import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
