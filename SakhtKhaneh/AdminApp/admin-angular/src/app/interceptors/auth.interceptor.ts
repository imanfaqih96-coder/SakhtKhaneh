import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRequest = request.url.includes('/api/auth/login') || request.url.includes('/api/auth/session');

      if (error.status === 401 && !isAuthRequest) {
        auth.clearSession();
        void router.navigate(['/login']);
      } else if (error.status === 428) {
        void auth.refreshSession().subscribe();
        void router.navigate(['/profile'], { queryParams: { required: 'password' } });
      }

      return throwError(() => error);
    })
  );
};
