import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario si usas *ngFor o *ngIf
import { Subscription } from 'rxjs';
import { NotificationWebsocket, NotificationPayload } from '../services/notification-websocket';

@Component({
  selector: 'app-gatehouse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gatehouse.html',
  styleUrl: './gatehouse.scss'
})
export class Gatehouse implements OnInit, OnDestroy {
  // Arreglo donde se irán acumulando las notificaciones
  public notificaciones: NotificationPayload[] = [];
  
  private sub!: Subscription;
  private wsService = inject(NotificationWebsocket);

  ngOnInit(): void {
    // Escuchamos el stream que ya inició app.ts
    this.sub = this.wsService.notifications$.subscribe({
      next: (nuevaNotificacion) => {
        console.log('[Gatehouse] Notificación recibida:', nuevaNotificacion);
        // Agregamos al inicio para que las más recientes aparezcan arriba
        this.notificaciones.unshift(nuevaNotificacion);
      },
      error: (err) => console.error('[Gatehouse] Error:', err)
    });
  }

  ngOnDestroy(): void {
    // Nos desunimos del stream al salir de la pantalla para liberar memoria
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}