import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.gaurd';



export const routes: Routes = [

  // صفحات عمومی
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [loginGuard] },

  // صفحات محافظت شده - داخل پوسته layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      // صفحه‌های دیگر نیز همینجا
      // { path: 'users', component: UsersComponent },
    ]
  },
  // ریدایرکت
  { path: '**', redirectTo: 'login' }
];
