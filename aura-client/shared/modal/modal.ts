import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {

  // Título que aparecerá en el encabezado
  title = input('Modal');

  // Controla si el modal está abierto
  isOpen = input(false);

  // Evento que emitimos al cerrar
  closed = output<void>();

  close(): void {
    this.closed.emit();
  }

}