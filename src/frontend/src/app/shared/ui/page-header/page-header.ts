import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly backLink = input<string | null>(null);
  readonly backLabel = input('Terug');
  readonly backIcon = faArrowLeft;
}
