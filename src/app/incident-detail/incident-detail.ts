import { Component, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IncidentService,
  IncidentServiceItem,
  IncidentComment
} from '../services/incident.service';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './incident-detail.html',
  styleUrl: './incident-detail.scss',
})
export class IncidentDetail {

  private incidentService = inject(IncidentService);

  incident = input<IncidentServiceItem | null>(null);
  selectedStatus = signal('');

  comments = signal<IncidentComment[]>([]);
  commentContent = signal('');

  statusUpdated = output<{
    id: number;
    status: IncidentServiceItem['status'];
  }>();

  constructor() {
    effect(() => {
      const currentIncident = this.incident();

      if (currentIncident) {
        this.selectedStatus.set(currentIncident.status);

        this.incidentService
          .getIncidentComments(currentIncident.id)
          .subscribe({
            next: (comments) => {
              this.comments.set(comments);
              console.log('Comentarios:', comments);
            },

            error: (error) => {
              console.error(
                'Error al obtener comentarios:',
                error
              );
            }
          });
      }
    });
  }

  saveStatus(): void {
    const currentIncident = this.incident();

    if (!currentIncident) {
      return;
    }

    this.incidentService
      .updateIncidentStatus(
        currentIncident.id,
        this.selectedStatus()
      )
      .subscribe({
        next: () => {
          this.statusUpdated.emit({
            id: currentIncident.id,
            status: this.selectedStatus()
          });

          console.log('Estado actualizado correctamente');
        },

        error: (error) => {
          console.error(
            'Error al actualizar el estado:',
            error
          );
        }
      });
  }

  addComment(): void {
  const currentIncident = this.incident();
  const content = this.commentContent().trim();

  if (!currentIncident || !content) {
    return;
  }

  this.incidentService
    .addIncidentComment(currentIncident.id, content)
    .subscribe({
      next: (comment) => {
        this.comments.update(comments => [
          ...comments,
          comment
        ]);

        this.commentContent.set('');

        console.log('Comentario agregado correctamente');
      },

      error: (error) => {
        console.error(
          'Error al agregar comentario:',
          error
        );
      }
    });
}

  getStatusClass(status: string): string {
    switch (status) {
      case 'open':
        return 'badge-open';

      case 'in_progress':
        return 'badge-in-progress';

      case 'attended':
        return 'badge-attended';

      case 'viewed':
        return 'badge-viewed';

      case 'cancelled':
        return 'badge-cancelled';

      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
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
        return status;
    }
  }
}
