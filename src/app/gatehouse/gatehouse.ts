import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationWebsocket, NotificationPayload, ConnectionState } from '../services/notification-websocket';
import { ModalComponent } from '../shared/components/modal/modal';

export interface ParsedNotification {
  id: string;
  status: 'granted' | 'denied';
  statusText: string;
  statusIcon: string;
  statusClass: string;
  
  accessType: 'qr' | 'plate' | 'manual' | 'rfid' | 'other';
  accessTypeLabel: string;
  accessTypeIcon: string;
  
  method: 'scan' | 'manual' | 'automatic' | 'other';
  methodLabel: string;
  methodIcon: string;
  
  guestName: string;
  residenceInfo: string;
  scannedCode?: string;
  deviceIdentifier?: string;
  message: string;
  timestamp: string;
  formattedTime: string;
  receivedAtMs: number;
  
  title: string;
  body: string;
  sourceType: string;
  
  plateDetails?: {
    plate?: string;
    brand?: string;
    color?: string;
  };
  
  accessCodeDetails?: {
    id?: number | string;
    validFrom?: string;
    validUntil?: string;
    uses?: number;
    maxUses?: number | null;
    activeDaysFormatted?: string;
  };
  
  rawPayload: any;
}

@Component({
  selector: 'app-gatehouse',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './gatehouse.html',
  styleUrl: './gatehouse.scss'
})
export class Gatehouse implements OnInit, OnDestroy {
  public notifications: ParsedNotification[] = [];
  public connectionState: ConnectionState = 'disconnected';
  public currentFilter: 'all' | 'granted' | 'denied' = 'all';
  
  // Auto-expiration TTL for notifications (10 minutes)
  private readonly EXPIRE_TTL_MS = 10 * 60 * 1000;
  private readonly STORAGE_KEY = 'aura_gatehouse_notifications';
  private cleanupIntervalId: any = null;

  // Pagination
  public currentPage: number = 1;
  public itemsPerPage: number = 5;

  // Modal Control
  public isModalOpen: boolean = false;
  public selectedNotification: ParsedNotification | null = null;
  public showRawJson: boolean = false;

  private notificationSub!: Subscription;
  private stateSub!: Subscription;
  private wsService = inject(NotificationWebsocket);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // Load persistent notifications from localStorage discarding expired ones
    this.loadStoredNotifications();

    // Ensure active WebSocket connection
    this.wsService.connect();

    // Listen to real-time socket notifications
    this.notificationSub = this.wsService.notifications$.subscribe({
      next: (rawPayload: NotificationPayload) => {
        console.log('[Gatehouse] RAW notification received:', rawPayload);
        const parsed = this.parseNotificationPayload(rawPayload);
        
        // Prevent duplicate entries
        const existingIdx = this.notifications.findIndex(n => n.id === parsed.id);
        if (existingIdx !== -1) {
          this.notifications.splice(existingIdx, 1);
        }

        // Prepend and ensure descending order (newest first)
        this.notifications.unshift(parsed);
        this.notifications.sort((a, b) => b.receivedAtMs - a.receivedAtMs);

        // Persist updated list to localStorage
        this.saveNotificationsToStorage();

        // Reset to page 1 upon receiving new notification
        this.currentPage = 1;

        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('[Gatehouse] Error in notification stream:', err)
    });

    // Listen to real-time connection state updates
    this.stateSub = this.wsService.connectionState$.subscribe({
      next: (state: ConnectionState) => {
        console.log('[Gatehouse] Connection state updated:', state);
        this.connectionState = state;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });

    // Start automatic cleanup timer every 15 seconds
    this.cleanupIntervalId = setInterval(() => {
      this.discardNotifications();
      this.cdr.markForCheck();
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.notificationSub) this.notificationSub.unsubscribe();
    if (this.stateSub) this.stateSub.unsubscribe();
    if (this.cleanupIntervalId) clearInterval(this.cleanupIntervalId);
  }

  /**
   * Loads notifications saved in localStorage, removing any older than 10 minutes.
   */
  private loadStoredNotifications(): void {
    if (typeof window === 'undefined') return;
    try {
      const rawStored = localStorage.getItem(this.STORAGE_KEY);
      if (rawStored) {
        const items: ParsedNotification[] = JSON.parse(rawStored);
        const now = Date.now();
        this.notifications = items
          .filter(n => (now - n.receivedAtMs) < this.EXPIRE_TTL_MS)
          .sort((a, b) => b.receivedAtMs - a.receivedAtMs);

        this.saveNotificationsToStorage();
      }
    } catch (err) {
      console.error('[Gatehouse] Error loading notifications from localStorage:', err);
    }
  }

  /**
   * Saves current notifications array to localStorage for full view & refresh persistence.
   */
  private saveNotificationsToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (err) {
      console.error('[Gatehouse] Error saving notifications to localStorage:', err);
    }
  }

  /**
   * Removes notifications from localStorage.
   */
  private clearStoredNotifications(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (err) {}
  }

  /**
   * Automatically discards notifications received more than 10 minutes ago.
   */
  private discardNotifications(): void {
    const now = Date.now();
    const beforeCount = this.notifications.length;
    this.notifications = this.notifications.filter(item => {
      return (now - item.receivedAtMs) < this.EXPIRE_TTL_MS;
    });
    const removedCount = beforeCount - this.notifications.length;
    if (removedCount > 0) {
      console.log(`[Gatehouse] Discarded ${removedCount} notifications exceeding 10-minute TTL.`);
      this.saveNotificationsToStorage();
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
    }
  }

  // Filter & Counter Getters
  get filteredNotifications(): ParsedNotification[] {
    if (this.currentFilter === 'granted') {
      return this.notifications.filter(n => n.status === 'granted');
    }
    if (this.currentFilter === 'denied') {
      return this.notifications.filter(n => n.status === 'denied');
    }
    return this.notifications;
  }

  // Pagination Getters
  get totalPages(): number {
    return Math.ceil(this.filteredNotifications.length / this.itemsPerPage) || 1;
  }

  get paginatedNotifications(): ParsedNotification[] {
    const total = this.totalPages;
    if (this.currentPage > total) {
      this.currentPage = total;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredNotifications.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get startIndex(): number {
    if (this.filteredNotifications.length === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    const end = this.currentPage * this.itemsPerPage;
    return Math.min(end, this.filteredNotifications.length);
  }

  public changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.cdr.markForCheck();
    }
  }

  public setFilter(filter: 'all' | 'granted' | 'denied'): void {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  public pagesArray(): number[] {
    const total = this.totalPages;
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  get countGranted(): number {
    return this.notifications.filter(n => n.status === 'granted').length;
  }

  get countDenied(): number {
    return this.notifications.filter(n => n.status === 'denied').length;
  }

  // Modal Actions
  public openModal(notification: ParsedNotification): void {
    this.selectedNotification = notification;
    this.showRawJson = false;
    this.isModalOpen = true;
  }

  public closeModal(): void {
    this.isModalOpen = false;
    this.selectedNotification = null;
    this.showRawJson = false;
  }

  public clearNotifications(): void {
    this.notifications = [];
    this.currentPage = 1;
    this.clearStoredNotifications();
    this.cdr.markForCheck();
  }

  /**
   * Parses and normalizes incoming notification payloads from backend controllers.
   */
  private parseNotificationPayload(raw: NotificationPayload): ParsedNotification {
    const id = String(
      raw['id'] || 
      raw['access_log_id'] || 
      raw['access_code']?.id || 
      Date.now() + Math.random().toString(36).substring(2, 7)
    );

    // 1. Status (granted | denied)
    const rawStatus = String(raw['status'] || 'denied').toLowerCase();
    const isGranted = rawStatus === 'granted';
    const status: 'granted' | 'denied' = isGranted ? 'granted' : 'denied';
    const statusText = isGranted ? 'Permitido' : 'Denegado';
    const statusIcon = isGranted ? 'check_circle' : 'cancel';
    const statusClass = isGranted ? 'granted' : 'denied';

    const accessCode = raw['access_code'] || null;
    const rawData = raw['data'] || null;

    // 2. Access Type (qr, plate, manual, rfid)
    let rawAccessType = String(accessCode?.access_type || raw['access_type'] || '').toLowerCase();
    if (!rawAccessType) {
      if (rawData?.plate || raw['plate'] || (raw['guest_name'] && String(raw['guest_name']).toLowerCase().includes('vehículo'))) {
        rawAccessType = 'plate';
      } else if (raw['scanned_code'] || accessCode) {
        rawAccessType = 'qr';
      } else {
        rawAccessType = 'qr';
      }
    }

    let accessType: 'qr' | 'plate' | 'manual' | 'rfid' | 'other' = 'other';
    let accessTypeLabel = 'Acceso General';
    let accessTypeIcon = 'key';

    if (rawAccessType === 'qr') {
      accessType = 'qr';
      accessTypeLabel = 'Código QR';
      accessTypeIcon = 'qr_code_2';
    } else if (rawAccessType === 'plate') {
      accessType = 'plate';
      accessTypeLabel = 'Placa Vehicular';
      accessTypeIcon = 'directions_car';
    } else if (rawAccessType === 'manual') {
      accessType = 'manual';
      accessTypeLabel = 'Registro Manual';
      accessTypeIcon = 'badge';
    } else if (rawAccessType === 'rfid') {
      accessType = 'rfid';
      accessTypeLabel = 'Tarjeta RFID';
      accessTypeIcon = 'contactless';
    }

    // 3. Method (scan, manual, automatic)
    const rawMethod = String(accessCode?.method || raw['method'] || 'scan').toLowerCase();
    let method: 'scan' | 'manual' | 'automatic' | 'other' = 'other';
    let methodLabel = 'Sistema';
    let methodIcon = 'tune';

    if (rawMethod === 'scan') {
      method = 'scan';
      methodLabel = 'Escaneo';
      methodIcon = 'qr_code_scanner';
    } else if (rawMethod === 'manual') {
      method = 'manual';
      methodLabel = 'Manual';
      methodIcon = 'edit_note';
    } else if (rawMethod === 'auto' || rawMethod === 'automatic') {
      method = 'automatic';
      methodLabel = 'Automático';
      methodIcon = 'sensors';
    }

    // 4. Guest / Subject Name
    let guestName = accessCode?.guest_name || raw['guest_name'];
    if (!guestName) {
      if (rawData?.plate || raw['plate']) {
        guestName = `Vehículo ${rawData?.plate || raw['plate']}`;
      } else if (raw['scanned_code']) {
        guestName = `Código #${raw['scanned_code']}`;
      } else {
        guestName = 'Invitado / Sin Registro';
      }
    }

    // 5. Residence Info
    let residenceInfo = 'General';
    if (raw['block']) {
      residenceInfo = raw['block'];
    } else if (accessCode?.residence_id) {
      residenceInfo = `Residencia #${accessCode.residence_id}`;
    } else if (raw['residence_id']) {
      residenceInfo = `Residencia #${raw['residence_id']}`;
    }

    // 6. Scanned Code & Device Identifier
    const scannedCode = raw['scanned_code'] || accessCode?.scanned_code || rawData?.plate || raw['plate'] || undefined;
    const deviceIdentifier = raw['device_identifier'] || accessCode?.device_identifier || undefined;

    // 7. Messages & Titles
    const message = raw['message'] || raw['body'] || (isGranted ? 'Acceso validado correctamente' : 'Intento de acceso denegado');
    const title = raw['title'] || `Acceso ${statusText}: ${guestName}`;
    const body = raw['body'] || `${accessTypeLabel} (${methodLabel}) en ${residenceInfo}. ${message}`;

    // 8. Timestamp and Formatted Time
    const timestampIso = raw['timestamp'] || new Date().toISOString();
    let formattedTime = '';
    try {
      const d = new Date(timestampIso);
      formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      formattedTime = timestampIso;
    }

    // 9. Vehicle Details
    let plateDetails: ParsedNotification['plateDetails'] = undefined;
    if (rawData?.plate || raw['plate'] || accessType === 'plate') {
      plateDetails = {
        plate: rawData?.plate || raw['plate'] || scannedCode || 'N/A',
        brand: rawData?.brand || undefined,
        color: rawData?.color || undefined,
      };
    }

    // 10. Access Code Details
    let accessCodeDetails: ParsedNotification['accessCodeDetails'] = undefined;
    if (accessCode) {
      accessCodeDetails = {
        id: accessCode.id,
        validFrom: accessCode.valid_from || undefined,
        validUntil: accessCode.valid_until || undefined,
        uses: accessCode.uses ?? 0,
        maxUses: accessCode.max_uses ?? null,
        activeDaysFormatted: this.formatActiveDays(accessCode.active_days),
      };
    }

    // 11. Source Type
    const sourceType = raw['source'] || raw['type'] || 'WebSocket Reverb';

    return {
      id,
      status,
      statusText,
      statusIcon,
      statusClass,
      accessType,
      accessTypeLabel,
      accessTypeIcon,
      method,
      methodLabel,
      methodIcon,
      guestName,
      residenceInfo,
      scannedCode,
      deviceIdentifier,
      message,
      timestamp: timestampIso,
      formattedTime,
      receivedAtMs: Date.now(),
      title,
      body,
      sourceType,
      plateDetails,
      accessCodeDetails,
      rawPayload: raw,
    };
  }

  private formatActiveDays(days?: number[]): string {
    if (!days || !Array.isArray(days) || days.length === 0) return 'Todos los días';
    const dayNames: { [key: number]: string } = {
      1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom'
    };
    return days.map(d => dayNames[d] || d).join(', ');
  }
}