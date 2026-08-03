import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.loadSession().pipe(
    map(session => {
      if (!session.authenticated) {
        return true;
      }

      return router.parseUrl(session.mustChangePassword ? '/profile?required=password' : '/dashboard');
    })
  );
};
