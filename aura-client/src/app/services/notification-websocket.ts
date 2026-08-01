import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Importante: La palabra 'export' aquí resuelve el error de importación en app.ts
export interface NotificationPayload {
  id?: string;
  title: string;
  body: string;
  timestamp?: string;
  source?: string;
  [key: string]: any; // Permite recibir cualquier otra propiedad adicional
}

@Injectable({
  providedIn: 'root'
})
export class NotificationWebsocketService {
  private socket$!: WebSocketSubject<NotificationPayload>;
  private notificationsSubject = new Subject<NotificationPayload>();

  // Observable público para que app.ts y gatehouse.ts se suscriban
  public notifications$: Observable<NotificationPayload> = this.notificationsSubject.asObservable();

  constructor() {}

  /**
   * Conecta con el servidor WebSocket (aura-back)
   * @param wsUrl Dirección URL de tu backend (ej. ws://localhost:3000/ws)
   */
  public connect(wsUrl: string = 'ws://localhost:3000'): void {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = webSocket<NotificationPayload>({
        url: wsUrl,
        openObserver: {
          next: () => console.log('[WS aura-client] Conexión establecida con éxito')
        },
        closeObserver: {
          next: () => console.log('[WS aura-client] Conexión cerrada')
        }
      });

      this.socket$.pipe(
        catchError(error => {
          console.error('[WS aura-client] Error en la conexión WebSocket:', error);
          return EMPTY;
        })
      ).subscribe({
        next: (data) => this.notificationsSubject.next(data),
        error: (err) => console.error('[WS aura-client] Error recibiendo mensaje:', err)
      });
    }
  }

  /**
   * Envía un mensaje al backend si fuera necesario
   */
  public sendMessage(msg: any): void {
    if (this.socket$) {
      this.socket$.next(msg);
    }
  }

  /**
   * Cierra la conexión WebSocket activamente
   */
  public close(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
  }
}