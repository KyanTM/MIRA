import { Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-error-state',
  imports: [FontAwesomeModule],
  templateUrl: './error-state.html',
  styleUrl: './error-state.css',
})
export class ErrorState {
  readonly title = input('Er ging iets mis');
  readonly message = input.required<string>();
  readonly retry = output<void>();
  readonly icon = faTriangleExclamation;
}
