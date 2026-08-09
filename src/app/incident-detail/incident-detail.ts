import { Component, effect, inject, input, output, signal, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IncidentService,
  IncidentServiceItem,
  IncidentComment
} from '../services/incident.service';
import { SpinnerComponent } from '../shared/components/spinner/spinner';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [DatePipe, SpinnerComponent],
  templateUrl: './incident-detail.html',
  styleUrl: './incident-detail.scss',
})
export class IncidentDetail implements OnDestroy {

  private incidentService = inject(IncidentService);

  incident = input<IncidentServiceItem | null>(null);
  selectedStatus = signal('');

  comments = signal<IncidentComment[]>([]);
  commentContent = signal('');
  isLoadingComments = signal(false);

  isSavingStatus = signal(false);
  statusSaved = signal(false);
  statusError = signal('');
  private statusSavedTimeoutId: any = null;

  isAddingComment = signal(false);
  commentError = signal('');

  statusUpdated = output<{
    id: number;
    status: IncidentServiceItem['status'];
  }>();

  constructor() {
    effect(() => {
      const currentIncident = this.incident();

      this.comments.set([]);
      this.statusError.set('');
      this.commentError.set('');

      if (currentIncident) {
        this.selectedStatus.set(currentIncident.status);
        this.isLoadingComments.set(true);

        this.incidentService
          .getIncidentComments(currentIncident.id)
          .subscribe({
            next: (comments) => {
              this.comments.set(comments);
              this.isLoadingComments.set(false);
            },

            error: (error) => {
              console.error(
                'Error al obtener comentarios:',
                error
              );

              this.isLoadingComments.set(false);
            }
          });
      }
    });
  }

  saveStatus(): void {
    const currentIncident = this.incident();

    if (!currentIncident || this.isSavingStatus()) {
      return;
    }

    if (this.statusSavedTimeoutId) {
      clearTimeout(this.statusSavedTimeoutId);
    }

    this.statusError.set('');
    this.isSavingStatus.set(true);

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

          this.isSavingStatus.set(false);
          this.statusSaved.set(true);

          this.statusSavedTimeoutId = setTimeout(() => {
            this.statusSaved.set(false);
          }, 1600);
        },

        error: (error) => {
          console.error(
            'Error al actualizar el estado:',
            error
          );

          this.isSavingStatus.set(false);
          this.statusError.set('No se pudo actualizar el estado. Intenta nuevamente.');
        }
      });
  }

  addComment(): void {
  const currentIncident = this.incident();
  const content = this.commentContent().trim();

  if (!currentIncident || !content || this.isAddingComment()) {
    return;
  }

  this.commentError.set('');
  this.isAddingComment.set(true);

  this.incidentService
    .addIncidentComment(currentIncident.id, content)
    .subscribe({
      next: (comment) => {
        this.comments.update(comments => [
          ...comments,
          comment
        ]);

        this.commentContent.set('');
        this.isAddingComment.set(false);
      },

      error: (error) => {
        console.error(
          'Error al agregar comentario:',
          error
        );

        this.isAddingComment.set(false);
        this.commentError.set('No se pudo agregar el comentario. Intenta nuevamente.');
      }
    });
}

  ngOnDestroy(): void {
    if (this.statusSavedTimeoutId) {
      clearTimeout(this.statusSavedTimeoutId);
    }
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
