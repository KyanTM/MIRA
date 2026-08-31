import { HttpErrorResponse } from '@angular/common/http';

export function imageUploadError(error: unknown): string {
  const status = error instanceof HttpErrorResponse ? error.status : null;

  if (status === 0) {
    return 'De server is niet bereikbaar. De afbeelding kon niet worden toegevoegd.';
  }

  if (status === 400 || status === 413) {
    return 'De afbeelding is geweigerd. Kies een geldig JPG-, PNG- of WebP-bestand van maximaal 20 MB.';
  }

  if (status === 409) {
    return 'De bezitting of haar afbeeldingen zijn intussen gewijzigd. Vernieuw de pagina en probeer opnieuw.';
  }

  if (status === 404) {
    return 'Deze bezitting is niet meer beschikbaar. De afbeelding kon niet worden toegevoegd.';
  }

  return 'De afbeelding kon niet worden toegevoegd. Probeer het opnieuw.';
}
