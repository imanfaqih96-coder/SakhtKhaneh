import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.loadSession().pipe(
    map(session => {
      if (!session.authenticated) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }

      if (session.mustChangePassword && !state.url.startsWith('/profile')) {
        return router.createUrlTree(['/profile'], { queryParams: { required: 'password' } });
      }

      return true;
    })
  );
};
