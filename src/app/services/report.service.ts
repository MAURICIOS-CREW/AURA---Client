import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ReportModule = 'dashboard' | 'finance' | 'services';
export type ReportRangeKey = 'today' | 'week' | 'month' | 'custom';

export interface ReportFilters {
  range: ReportRangeKey;
  from?: string;
  to?: string;
}

const LOADING_TAB_HTML = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Generando reporte… · AURA</title>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f4f7fb;
      color: #195491;
    }
    .wrap { text-align: center; }
    .spinner {
      width: 42px;
      height: 42px;
      margin: 0 auto 18px;
      border-radius: 50%;
      border: 4px solid #dbe4ee;
      border-top-color: #2E6DB4;
      animation: spin 0.8s linear infinite;
    }
    p { font-size: 15px; font-weight: 600; margin: 0; }
    small { color: #64748b; font-weight: 400; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="spinner"></div>
    <p>Generando tu reporte…</p>
    <small>Esta pestaña se llenará automáticamente en unos segundos.</small>
  </div>
</body>
</html>`;

/**
 * Genera el reporte en PDF en vivo (nunca se guarda en el servidor) y lo
 * muestra en una pestaña nueva solo hasta que el contenido está listo: la
 * espera se refleja en el spinner del modal que abrió la petición, no en
 * una pestaña en blanco navegando contra el backend.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private http = inject(HttpClient);

  private viewEndpoints: Record<ReportModule, string> = {
    dashboard: `${environment.apiUrl}/admin/reports/dashboard/view`,
    finance: `${environment.apiUrl}/admin/reports/finance/view`,
    services: `${environment.apiUrl}/admin/reports/services/view`,
  };

  /**
   * Debe llamarse de forma síncrona dentro del gesto de click: la pestaña
   * se reserva de inmediato (con una pantalla de carga propia, para evitar
   * el bloqueo de pop-ups de los navegadores) y solo se rellena con el PDF
   * una vez que el blob terminó de descargarse por completo.
   */
  openReport(module: ReportModule, filters: ReportFilters): Observable<void> {
    const tab = window.open('', '_blank');

    if (tab) {
      tab.document.write(LOADING_TAB_HTML);
      tab.document.close();
    }

    return new Observable<void>((subscriber) => {
      const subscription = this.http
        .get(this.viewEndpoints[module], {
          params: this.buildParams(filters),
          responseType: 'blob',
        })
        .subscribe({
          next: (blob) => {
            const objectUrl = window.URL.createObjectURL(blob);

            if (tab && !tab.closed) {
              tab.location.href = objectUrl;
            } else {
              window.open(objectUrl, '_blank');
            }

            subscriber.next();
            subscriber.complete();
          },
          error: (err: HttpErrorResponse) => {
            tab?.close();
            this.parseBlobError(err).then((message) => subscriber.error(new Error(message)));
          },
        });

      return () => subscription.unsubscribe();
    });
  }

  private buildParams(filters: ReportFilters): HttpParams {
    let params = new HttpParams().set('range', filters.range);

    if (filters.range === 'custom') {
      if (filters.from) {
        params = params.set('from', filters.from);
      }
      if (filters.to) {
        params = params.set('to', filters.to);
      }
    }

    return params;
  }

  private async parseBlobError(err: HttpErrorResponse): Promise<string> {
    const fallback = 'No se pudo generar el reporte. Intenta nuevamente.';

    if (!(err.error instanceof Blob)) {
      return err.error?.message ?? fallback;
    }

    try {
      const text = await err.error.text();
      const parsed = JSON.parse(text);
      return parsed.message ?? parsed.error ?? fallback;
    } catch {
      return fallback;
    }
  }
}
