import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationPayload, NotificationWebsocket } from './services/notification-websocket';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})

export class App implements OnInit, OnDestroy {
  protected readonly title = signal('aura-client');
  isAccesosOpen: boolean = false;

  // Lista donde almacenaremos las notificaciones recibidas
  notificaciones: NotificationPayload[] = [];
  
  private sub!: Subscription;

  // Inyección de dependencias moderna con inject()
  private wsService = inject(NotificationWebsocket);

  ngOnInit(): void {
    // 1. Iniciar conexión WebSocket con aura-back
    // Sustituye con tu IP o URL real (ejemplo: ws://localhost:3000 o ws://192.168.1.50:3000)
    this.wsService.connect('ws://localhost:3000');

    // 2. Suscribirse a las notificaciones que lleguen desde Android
    this.sub = this.wsService.notifications$.subscribe({
      next: (nuevaNotificacion) => {
        console.log('¡Notificación de Android recibida en app-root!', nuevaNotificacion);
        this.notificaciones.unshift(nuevaNotificacion);
      },
      error: (err) => console.error('Error en WebSocket:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.wsService.close();
  }
}