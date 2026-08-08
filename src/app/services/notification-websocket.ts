import { Injectable, OnDestroy, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { environment } from '../../environments/environment';

// Registrar Pusher en el objeto window global para que Laravel Echo pueda utilizarlo
if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

export interface NotificationPayload {
  id?: string;
  access_log_id?: number | string;
  title: string;
  body: string;
  status?: string;
  access_type?: string;
  method?: string;
  message?: string;
  guest_name?: string;
  block?: string;
  plate?: string;
  timestamp?: string;
  type?: string;
  source?: string;
  [key: string]: any;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'unavailable' | 'failed' | 'reconnecting';

@Injectable({
  providedIn: 'root'
})
export class NotificationWebsocket implements OnDestroy {
  private ngZone = inject(NgZone);

  private echo: Echo<'reverb'> | null = null;
  private notificationsSubject = new Subject<NotificationPayload>();
  private connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');
  private activeChannels = new Set<string>();

  private isExplicitlyClosed = false;
  private reconnectTimer: any = null;
  private onlineListener?: () => void;
  private visibilityListener?: () => void;

  // Observable público para notificaciones en tiempo real
  public notifications$: Observable<NotificationPayload> = this.notificationsSubject.asObservable();
  
  // Observable público del estado de la conexión (para indicar en UI si está conectado, reconectando, etc.)
  public connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();

  constructor() {
    this.setupNetworkListeners();
  }

  private updateConnectionState(state: ConnectionState): void {
    this.ngZone.run(() => {
      if (this.connectionStateSubject.value !== state) {
        console.log(`[WS aura-client] Estado actualizado en NgZone: ${state}`);
        this.connectionStateSubject.next(state);
      }
    });
  }

  /**
   * Conecta con el servidor WebSocket (Laravel Reverb).
   * Mantiene reconexión automática persistente si cae el servidor o la red.
   */
  public connect(authToken?: string): void {
    this.isExplicitlyClosed = false;

    if (this.echo) {
      const state = this.echo.connector?.pusher?.connection?.state;
      let mappedState: ConnectionState = 'disconnected';
      if (state === 'connected') mappedState = 'connected';
      else if (state === 'connecting') mappedState = 'connecting';
      else if (state === 'unavailable') mappedState = 'unavailable';
      else if (state === 'failed') mappedState = 'failed';

      this.updateConnectionState(mappedState);

      if (state === 'connected' || state === 'connecting') {
        return;
      }
      this.reconnect();
      return;
    }

    this.initEcho(authToken);
  }

  /**
   * Inicializa la instancia de Laravel Echo con pings rápidos y autorizador dinámico.
   */
  private initEcho(authToken?: string): void {
    try {
      this.updateConnectionState('connecting');

      this.echo = new Echo({
        broadcaster: 'reverb',
        key: environment.reverbAppKey,
        wsHost: environment.reverbHost,
        wsPort: environment.reverbPort,
        wssPort: environment.reverbPort,
        forceTLS: environment.reverbScheme === 'https',
        enabledTransports: ['ws', 'wss'],

        // Detección rápida de caídas de red o reinicio del servidor (Heartbeat cada 10s)
        activityTimeout: 10000,
        pongTimeout: 5000,

        // Autorizador dinámico para refrescar siempre el Token Bearer de la sesión actual
        authorizer: (channel: any) => {
          return {
            authorize: (socketId: string, callback: Function) => {
              const currentToken = authToken || this.getStoredToken();
              const authUrl = environment.broadcastingAuthUrl || `${environment.apiUrl}/broadcasting/auth`;

              fetch(authUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': currentToken ? `Bearer ${currentToken}` : '',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name
                })
              })
                .then(async response => {
                  if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Auth falló (${response.status}): ${errText}`);
                  }
                  return response.json();
                })
                .then(data => callback(false, data))
                .catch(error => {
                  console.error('[WS aura-client] Error autorizando canal privado:', error);
                  callback(true, error);
                });
            }
          };
        }
      });

      this.bindPusherEvents();
      console.log('[WS aura-client] Inicializado Laravel Echo con Reverb (Reconexión Automática Activada)');

      // Suscribir canales registrados o canal por defecto 'access-logs'
      if (this.activeChannels.size === 0) {
        this.subscribePrivateChannel('access-logs');
      } else {
        this.resubscribeChannels();
      }

    } catch (error) {
      console.error('[WS aura-client] Error al inicializar WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Escucha eventos de conexión internos de Pusher/Reverb para gestionar reconexión continua.
   */
  private bindPusherEvents(): void {
    if (!this.echo || !this.echo.connector || !this.echo.connector.pusher) return;

    const pusher = this.echo.connector.pusher;

    pusher.connection.bind('state_change', (states: { previous: string; current: string }) => {
      console.log(`[WS aura-client] Estado de conexión: ${states.previous} ➔ ${states.current}`);

      let mappedState: ConnectionState = 'disconnected';
      switch (states.current) {
        case 'connected':
          mappedState = 'connected';
          this.clearReconnectTimer();
          break;
        case 'connecting':
          mappedState = 'connecting';
          break;
        case 'unavailable':
          mappedState = 'unavailable';
          this.scheduleReconnect();
          break;
        case 'failed':
          mappedState = 'failed';
          this.scheduleReconnect();
          break;
        case 'disconnected':
          mappedState = 'disconnected';
          this.scheduleReconnect();
          break;
      }

      this.updateConnectionState(mappedState);
    });

    pusher.connection.bind('error', (err: any) => {
      console.warn('[WS aura-client] Error en cliente Pusher/Reverb:', err);
      this.scheduleReconnect();
    });
  }

  /**
   * Programa un intento de reconexión si la conexión se interrumpió y no fue un cierre explícito.
   */
  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed || this.reconnectTimer) {
      return;
    }

    console.log('[WS aura-client] Programando reconexión automática en 3 segundos...');
    this.updateConnectionState('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isExplicitlyClosed) {
        this.reconnect();
      }
    }, 3000);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Intenta reconectar la conexión existente o forzar reinicialización si el socket quedó corrupto.
   */
  public reconnect(): void {
    if (this.isExplicitlyClosed) return;

    console.log('[WS aura-client] Intentando reconectar WebSocket...');

    if (this.echo && this.echo.connector && this.echo.connector.pusher) {
      try {
        const state = this.echo.connector.pusher.connection.state;
        if (state === 'disconnected' || state === 'unavailable' || state === 'failed') {
          this.echo.connector.pusher.connect();
        }
      } catch (err) {
        console.warn('[WS aura-client] Error re-conectando socket existente, reinicializando Echo...', err);
        this.forceReinit();
      }
    } else {
      this.forceReinit();
    }
  }

  /**
   * Destruye la instancia actual e inicia una totalmente nueva.
   */
  private forceReinit(): void {
    if (this.echo) {
      try {
        this.echo.disconnect();
      } catch {}
      this.echo = null;
    }
    this.initEcho();
  }

  /**
   * Escucha eventos de red del navegador (online y cambio de visibilidad de pestaña) para reconectar de inmediato.
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    this.onlineListener = () => {
      console.log('[WS aura-client] Evento de red: El navegador volvió a estar ONLINE. Re-verificando WebSocket...');
      this.reconnect();
    };

    this.visibilityListener = () => {
      if (document.visibilityState === 'visible') {
        console.log('[WS aura-client] Evento de visibilidad: Pestaña activa. Re-verificando WebSocket...');
        this.reconnect();
      }
    };

    window.addEventListener('online', this.onlineListener);
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  /**
   * Suscribe a un canal privado de Laravel y escucha eventos de notificaciones.
   * @param channelName Nombre del canal privado sin el prefijo 'private-' (ej. 'access-logs')
   */
  public subscribePrivateChannel(channelName: string): void {
    this.activeChannels.add(channelName);

    if (!this.echo) {
      this.connect();
      return;
    }

    console.log(`[WS aura-client] Suscribiendo al canal privado: private-${channelName}`);

    const channel = this.echo.private(channelName);

    // Escuchar evento genérico UserNotificationEvent
    channel.listen('.UserNotificationEvent', (data: NotificationPayload) => {
      this.handleIncomingNotification(channelName, data);
    });

    // Escuchar evento de accesos validados AccessValidatedEvent
    channel.listen('.AccessValidatedEvent', (data: NotificationPayload) => {
      this.handleIncomingNotification(channelName, data);
    });
  }

  /**
   * Re-suscribe todos los canales activos al recuperar la conexión.
   */
  private resubscribeChannels(): void {
    if (!this.echo) return;
    const channelsToSubscribe = Array.from(this.activeChannels);
    this.activeChannels.clear();
    channelsToSubscribe.forEach(channelName => {
      this.subscribePrivateChannel(channelName);
    });
  }

  /**
   * Procesa la notificación recibida, imprimriéndola en consola y emitiéndola al Subject.
   */
  private handleIncomingNotification(channelName: string, data: NotificationPayload): void {
    console.log(`[WS Notificación Recibida] [Canal: private-${channelName}]:`, data);
    this.ngZone.run(() => {
      this.notificationsSubject.next(data);
    });
  }

  /**
   * Cierra la conexión activamente y limpia las suscripciones de los canales.
   */
  public close(): void {
    this.isExplicitlyClosed = true;
    this.clearReconnectTimer();

    if (this.echo) {
      this.activeChannels.forEach(channelName => {
        try {
          this.echo?.leaveChannel(`private-${channelName}`);
        } catch {}
      });
      this.activeChannels.clear();
      try {
        this.echo.disconnect();
      } catch {}
      this.echo = null;
      this.updateConnectionState('disconnected');
      console.log('[WS aura-client] Conexión WebSocket cerrada explícitamente');
    }
  }

  /**
   * Alias de compatibilidad para cerrar la conexión.
   */
  public disconnect(): void {
    this.close();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      if (this.onlineListener) window.removeEventListener('online', this.onlineListener);
      if (this.visibilityListener) document.removeEventListener('visibilitychange', this.visibilityListener);
    }
    this.close();
  }

  /**
   * Obtiene el token de autenticación guardado en almacenamiento local o de sesión.
   */
  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('aura_auth_token') ||
      sessionStorage.getItem('aura_auth_token')
    );
  }
}