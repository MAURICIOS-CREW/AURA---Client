import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { SpinnerComponent } from '../spinner/spinner';
import {
  ReportService,
  ReportModule as ReportModuleType,
  ReportRangeKey,
} from '../../../services/report.service';

interface RangeOption {
  key: ReportRangeKey;
  label: string;
  icon: string;
}

/**
 * Botón + modal de filtros reutilizable para descargar el PDF generado en
 * vivo por el backend (Dashboard/Finanzas/Servicios). Una sola
 * implementación de la lógica de descarga/carga/error para las tres vistas.
 */
@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, SpinnerComponent],
  templateUrl: './report-generator.html',
  styleUrl: './report-generator.scss',
})
export class ReportGeneratorComponent {

  @Input({ required: true }) reportType!: ReportModuleType;
  @Input() label = 'Generar reporte';
  @Input() variant: 'report' | 'primary' = 'primary';

  private reportService = inject(ReportService);

  readonly rangeOptions: RangeOption[] = [
    { key: 'today', label: 'Hoy', icon: 'today' },
    { key: 'week', label: 'Esta semana', icon: 'date_range' },
    { key: 'month', label: 'Este mes', icon: 'calendar_month' },
    { key: 'custom', label: 'Personalizado', icon: 'tune' },
  ];

  isModalOpen = signal(false);
  isGenerating = signal(false);
  selectedRange = signal<ReportRangeKey>('month');
  errorMessage = signal('');
  successMessage = signal('');

  customFrom = new Date(new Date().setDate(1)).toISOString().substring(0, 10);
  customTo = new Date().toISOString().substring(0, 10);

  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;

  get isCustomInvalid(): boolean {
    return this.selectedRange() === 'custom' && (!this.customFrom || !this.customTo);
  }

  openModal(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    if (this.isGenerating()) {
      return;
    }
    this.isModalOpen.set(false);
  }

  selectRange(key: ReportRangeKey): void {
    this.selectedRange.set(key);
    this.errorMessage.set('');
  }

  generate(): void {
    if (this.isGenerating() || this.isCustomInvalid) {
      return;
    }

    if (this.successTimeoutId) {
      clearTimeout(this.successTimeoutId);
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isGenerating.set(true);

    const range = this.selectedRange();

    this.reportService
      .openReport(this.reportType, {
        range,
        from: range === 'custom' ? this.customFrom : undefined,
        to: range === 'custom' ? this.customTo : undefined,
      })
      .subscribe({
        next: () => {
          this.isGenerating.set(false);
          this.successMessage.set('El reporte se abrió en una pestaña nueva.');

          this.successTimeoutId = setTimeout(() => {
            this.isModalOpen.set(false);
            this.successMessage.set('');
          }, 1400);
        },
        error: (err: Error) => {
          this.isGenerating.set(false);
          this.errorMessage.set(err.message || 'No se pudo generar el reporte. Intenta nuevamente.');
        },
      });
  }
}
