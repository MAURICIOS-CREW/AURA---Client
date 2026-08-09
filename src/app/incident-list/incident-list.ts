import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IncidentService, IncidentServiceItem } from '../services/incident.service';
import { ModalComponent } from '../shared/components/modal/modal';
import { IncidentDetail } from '../incident-detail/incident-detail';
import { UserService, Resident } from '../services/user.service';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../shared/components/spinner/spinner';

@Component({
  selector: 'app-list-of-services',
  standalone: true,
  imports: [CommonModule, DatePipe, ModalComponent, IncidentDetail, FormsModule, SpinnerComponent],
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.scss'
})
export class IncidentList implements OnInit, OnDestroy {
  private incidentService = inject(IncidentService);
  private userService = inject(UserService);

  residentsList = signal<Resident[]>([]);
  incidentsList = signal<IncidentServiceItem[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  reporterUserId: number | null = null;
  title: string = '';
  description: string = '';
  status: string = '';

  successMessage: string = '';
  errorMessage: string = '';
  private successTimeoutId: any = null;

  selectedIncident = signal<IncidentServiceItem | null>(null);
  showIncidentModal = signal<boolean>(false);

  ngOnInit(): void {
    this.fetchIncidents();
    this.fetchResidents();
}

ngOnDestroy(): void {
  if (this.successTimeoutId) {
    clearTimeout(this.successTimeoutId);
  }
}

fetchIncidents(): void {
    this.isLoading.set(true);

    this.incidentService.getIncidents().subscribe({
      next: (response) => {
        this.incidentsList.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar la lista de incidencias:', err);
        this.isLoading.set(false);
      }
    });
  }
  

fetchResidents(): void {
  this.userService.getResidents().subscribe({
    next: (response) => {
      this.residentsList.set(response.data);
    },
    error: (err) => {
      console.error('Error al cargar residentes:', err);
    }
  });
}


openIncidentModal(incident: IncidentServiceItem): void {
    this.selectedIncident.set(incident);
    this.showIncidentModal.set(true);
  }

closeIncidentModal(): void {
    this.showIncidentModal.set(false);
    this.selectedIncident.set(null);
  }


getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'badge-open';
      case 'IN_PROGRESS':
        return 'badge-in_progress';
      case 'ATTENDED':
        return 'badge-attended';
      case 'VIEWED':
        return 'badge-viewed';
      case 'CANCELLED':
        return 'badge-cancelled';
      default:
        return 'badge-unknown';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'Abierto';
      case 'in_progress':
        return 'En progreso';
      case 'attended':
        return 'Atendido';
      case 'viewed':
        return 'Visto';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Sin estado';
    }
  }
  
onStatusUpdated(event: {
  id: number;
  status: IncidentServiceItem['status'];
}): void {

  this.incidentsList.update(incidents =>
    incidents.map(incident =>
      incident.id === event.id
        ? { ...incident, status: event.status }
        : incident
    )
  );

  const currentIncident = this.selectedIncident();

  if (currentIncident?.id === event.id) {
    this.selectedIncident.set({
      ...currentIncident,
      status: event.status
    });
  }
}

createIncidentPayload() {
  const payload = {
    reporter_user_id: this.reporterUserId,
    title: this.title,
    description: this.description,
    status: this.status
  };

  console.log('Payload de incidencia:', payload);

  return payload;
}

onSubmit(): void {
  if (this.isSubmitting()) {
    return;
  }

  if (this.successTimeoutId) {
    clearTimeout(this.successTimeoutId);
  }

  this.successMessage = '';
  this.errorMessage = '';
  this.isSubmitting.set(true);

  const payload = this.createIncidentPayload();

  this.incidentService.createIncident(payload).subscribe({
    next: (response) => {
      console.log('Incidencia creada correctamente:', response);

      this.isSubmitting.set(false);
      this.successMessage = 'Incidencia registrada correctamente.';
      this.resetForm();
      this.fetchIncidents();

      this.successTimeoutId = setTimeout(() => {
        this.successMessage = '';
      }, 3500);
    },
    error: (err) => {
      console.error('Error al crear la incidencia:', err);

      this.isSubmitting.set(false);
      this.errorMessage =
        err.error?.error ?? 'No se pudo registrar la incidencia. Intenta nuevamente.';
    }
  });
}

resetForm(): void {
    this.reporterUserId = null;
    this.title = '';
    this.description = '';
    this.status = '';
}

}