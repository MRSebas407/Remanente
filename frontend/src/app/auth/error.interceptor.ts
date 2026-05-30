import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../shared/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 0) {
        toast.error('No se pudo conectar con el servidor. Verifica tu conexión.');
      } else if (err.status === 401) {
        toast.error('Sesión expirada. Inicia sesión nuevamente.');
      } else if (err.status === 403) {
        toast.error('No tienes permisos para realizar esta acción.');
      } else if (err.status === 404) {
        toast.error('El recurso solicitado no existe.');
      } else if (err.status >= 500) {
        toast.error('Error interno del servidor. Intenta más tarde.');
      }
      return throwError(() => err);
    })
  );
};
