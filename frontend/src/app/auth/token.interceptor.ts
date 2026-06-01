import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

const AUTH_ROUTES = ['/auth/login/', '/auth/register/'];

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (AUTH_ROUTES.some(route => req.url.includes(route))) {
    return next(req);
  }
  const auth = inject(AuthService);
  const token = auth.getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
