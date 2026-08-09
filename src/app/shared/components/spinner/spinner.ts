import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
})
export class SpinnerComponent {
  /** Diameter of the spinner */
  @Input() size: 'sm' | 'md' = 'sm';

  /** 'primary' (brand blue) for light backgrounds, 'light' (white) for filled buttons */
  @Input() variant: 'primary' | 'light' = 'primary';
}
