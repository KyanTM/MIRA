import { formatDate } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

@Pipe({
  name: 'dateOnly',
})
export class DateOnlyPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(value: string | null | undefined, format = 'd MMM y'): string | null {
    if (!value) {
      return null;
    }

    const match = DATE_ONLY_PATTERN.exec(value);

    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return formatDate(date, format, this.locale, 'UTC');
  }
}
