import { Component, Input, Output, EventEmitter, HostListener, OnChanges, SimpleChanges, OnDestroy, OnInit, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class ModalComponent implements OnInit, OnChanges, OnDestroy {
  /** Controls modal visibility */
  @Input() isOpen: boolean = false;

  /** Optional header title (if not using custom [modal-header] slot) */
  @Input() title?: string;

  /** Optional header subtitle */
  @Input() subtitle?: string;

  /** Optional Material icon name for the header */
  @Input() icon?: string;

  /** Dynamic styling class for the modal header (e.g., 'granted', 'denied', 'primary', 'warning', 'danger', 'info') */
  @Input() headerClass: string = '';

  /** Maximum width of the modal container (default: '680px') */
  @Input() maxWidth: string = '680px';

  /** Whether clicking the dark backdrop closes the modal */
  @Input() closeOnBackdrop: boolean = true;

  /** Whether pressing the ESC key closes the modal */
  @Input() closeOnEsc: boolean = true;

  /** Whether to show the top-right header close (X) button */
  @Input() showCloseButton: boolean = true;

  /** Event emitted when the modal is closed */
  @Output() closed = new EventEmitter<void>();

  /** Event emitted for two-way data binding [(isOpen)] */
  @Output() isOpenChange = new EventEmitter<boolean>();

  private elementRef = inject(ElementRef);

  /**
   * Ciertos wrappers de página (`.dashboard-wrapper`) usan `backdrop-filter`,
   * que crea un containing block nuevo para los hijos `position: fixed`.
   * Sin esto, el backdrop del modal quedaba recortado dentro de ese wrapper
   * en lugar de cubrir toda la ventana. Sacar el propio host al final de
   * `<body>` evita el problema sin tener que tocar el CSS de cada página.
   */
  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.body.appendChild(this.elementRef.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      this.handleBodyScroll(this.isOpen);
    }
  }

  ngOnDestroy(): void {
    this.handleBodyScroll(false);

    if (typeof document !== 'undefined' && this.elementRef.nativeElement.parentNode === document.body) {
      document.body.removeChild(this.elementRef.nativeElement);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event): void {
    if (this.isOpen && this.closeOnEsc) {
      event.preventDefault();
      this.close();
    }
  }

  public open(): void {
    this.isOpen = true;
    this.isOpenChange.emit(true);
    this.handleBodyScroll(true);
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.closed.emit();
    this.handleBodyScroll(false);
  }

  public onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  public onCardClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  private handleBodyScroll(isLocked: boolean): void {
    if (typeof document === 'undefined') return;
    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}
