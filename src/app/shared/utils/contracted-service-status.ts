import { ContractedServiceStatus } from '../../services/contracted.service';

/**
 * Mapeo único de estado de una contratación -> clase de badge / etiqueta / si
 * necesita horario. Usado por list-of-services, dashboard y
 * contracted-service-detail para que los tres muestren exactamente lo mismo:
 * solo 'created' significa "sin horario", nunca 'in_progress' ni un estado
 * terminal (cancelado/reembolsado) que nunca llegó a agendarse.
 */

export function getContractedServiceStatusClass(status: string): string {
  switch (status) {
    case 'created': return 'badge-created';
    case 'scheduled': return 'badge-scheduled';
    case 'in_progress': return 'badge-in-progress';
    case 'completed': return 'badge-completed';
    case 'refunded': return 'badge-refunded';
    case 'cancelled': return 'badge-cancelled';
    default: return 'badge-unknown';
  }
}

export function getContractedServiceStatusLabel(status: string): string {
  switch (status) {
    case 'created': return 'Sin horario';
    case 'scheduled': return 'Agendado';
    case 'in_progress': return 'En progreso';
    case 'completed': return 'Completado';
    case 'refunded': return 'Reembolsado';
    case 'cancelled': return 'Cancelado';
    default: return 'Sin estado';
  }
}

export function contractedServiceNeedsSchedule(status: ContractedServiceStatus | string): boolean {
  return status === 'created';
}
