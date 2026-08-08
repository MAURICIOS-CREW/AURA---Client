import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IncidentService, IncidentServiceItem } from '../services/incident.service';

@Component({
  selector: 'app-list-of-services',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.scss'
})

export class IncidentList  {
  private incidentService = inject(IncidentService);
  
    incidentsList = signal<IncidentServiceItem[]>([]);
    isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchIncidents();
  }

  fetchIncidents(): void {
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
  
getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'OPEN': return 'badge-open';
      case 'IN_PROGRESS': return 'badge-in_progress';
      case 'ATTENDED': return 'badge-attended';
      case 'VIEWED': return 'badge-viewed';
      case 'CANCELLED': return 'badge-cancelled';
      default: return 'badge-unknown';
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

}