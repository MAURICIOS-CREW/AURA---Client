import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Buscamos el token en localStorage
  const token = localStorage.getItem('aura_auth_token');


// 👈 Agregamos esta línea para debuguear en consola
  console.log('🚀 Interceptor activo! Token encontrado:', token);

  // Si existe el token, clonamos la petición y le añadimos el encabezado Authorization
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    return next(authReq);
  }

  return next(req);
};