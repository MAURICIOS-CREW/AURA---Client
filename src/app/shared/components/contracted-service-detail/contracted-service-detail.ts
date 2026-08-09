import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ContractedService,
  ContractedServiceItem,
  ContractedServiceStatus,
} from '../../../services/contracted.service';
import { SpinnerComponent } from '../spinner/spinner';
import {
  contractedServiceNeedsSchedule,
  getContractedServiceStatusClass,
  getContractedServiceStatusLabel,
} from '../../utils/contracted-service-status';

const NEXT_STATUS_OPTIONS: Partial<Record<ContractedServiceStatus, ContractedServiceStatus[]>> = {
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
};

@Component({
  selector: 'app-contracted-service-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, FormsModule, SpinnerComponent],
  templateUrl: './contracted-service-detail.html',
  styleUrl: './contracted-service-detail.scss',
})
export class ContractedServiceDetail {

  private contractedServiceApi = inject(ContractedService);

  item = input<ContractedServiceItem | null>(null);
  updated = output<void>();

  scheduleDateTime = signal('');
  scheduleNotes = signal('');
  isSubmittingSchedule = signal(false);
  scheduleError = signal('');

  selectedNextStatus = signal<ContractedServiceStatus | ''>('');
  statusNotes = signal('');
  isUpdatingStatus = signal(false);
  statusError = signal('');
  statusUpdateSuccess = signal(false);

  constructor() {
    effect(() => {
      const current = this.item();

      this.scheduleError.set('');
      this.statusError.set('');
      this.statusUpdateSuccess.set(false);
      this.selectedNextStatus.set('');
      this.statusNotes.set('');

      if (current) {
        this.scheduleDateTime.set(this.toDateTimeLocal(current.preferred_date, current.visit_time_from));
        this.scheduleNotes.set(current.notes ?? '');
      }
    });
  }

  needsSchedule(item: ContractedServiceItem): boolean {
    return contractedServiceNeedsSchedule(item.status);
  }

  isTerminal(item: ContractedServiceItem): boolean {
    return item.status === 'completed' || item.status === 'cancelled' || item.status === 'refunded';
  }

  nextStatusOptions(item: ContractedServiceItem): ContractedServiceStatus[] {
    return NEXT_STATUS_OPTIONS[item.status] ?? [];
  }

  submitSchedule(): void {
    const current = this.item();

    if (!current || !this.scheduleDateTime() || this.isSubmittingSchedule()) {
      return;
    }

    this.scheduleError.set('');
    this.isSubmittingSchedule.set(true);

    this.contractedServiceApi
      .scheduleService(current.id, {
        exact_scheduled_at: this.scheduleDateTime(),
        notes: this.scheduleNotes() || null,
      })
      .subscribe({
        next: () => {
          this.isSubmittingSchedule.set(false);
          this.updated.emit();
        },

        error: (error) => {
          console.error('Error al agendar el servicio:', error);
          this.isSubmittingSchedule.set(false);
          this.scheduleError.set(
            error.error?.message ?? 'No se pudo agendar el servicio. Intenta nuevamente.'
          );
        }
      });
  }

  submitStatusUpdate(): void {
    const current = this.item();
    const nextStatus = this.selectedNextStatus();

    if (!current || !nextStatus || this.isUpdatingStatus()) {
      return;
    }

    this.statusError.set('');
    this.isUpdatingStatus.set(true);

    this.contractedServiceApi
      .updateServiceStatus(current.id, nextStatus, this.statusNotes() || null)
      .subscribe({
        next: () => {
          this.isUpdatingStatus.set(false);
          this.statusUpdateSuccess.set(true);
          this.updated.emit();
        },

        error: (error) => {
          console.error('Error al actualizar el estado del servicio:', error);
          this.isUpdatingStatus.set(false);
          this.statusError.set(
            error.error?.message ?? 'No se pudo actualizar el estado. Intenta nuevamente.'
          );
        }
      });
  }

  getStatusClass = getContractedServiceStatusClass;
  getStatusLabel = getContractedServiceStatusLabel;

  getStatusOptionLabel(status: ContractedServiceStatus): string {
    return getContractedServiceStatusLabel(status);
  }

  getChargeStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'badge-paid';
      case 'pending': return 'badge-pending';
      case 'refunded': return 'badge-refunded';
      case 'cancelled': return 'badge-cancelled';
      default: return 'badge-unknown';
    }
  }

  getChargeStatusLabel(status: string): string {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'refunded': return 'Reembolsado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }

  private toDateTimeLocal(date?: string, time?: string): string {
    if (!date) {
      return '';
    }

    const datePart = date.substring(0, 10);
    const timePart = (time ?? '09:00').substring(0, 5);
    return `${datePart}T${timePart}`;
  }
}
