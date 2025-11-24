import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule, FormsModule] // <- add this line
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) { }

  login() {
    this.auth.login(this.credentials).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.message;
      },
    });
  }
}
