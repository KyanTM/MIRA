import { registerLocaleData } from '@angular/common';
import localeNlBe from '@angular/common/locales/nl-BE';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DateOnlyPipe } from './date-only.pipe';

describe('DateOnlyPipe', () => {
  let pipe: DateOnlyPipe;

  beforeAll(() => registerLocaleData(localeNlBe));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DateOnlyPipe, { provide: LOCALE_ID, useValue: 'nl-BE' }],
    });

    pipe = TestBed.inject(DateOnlyPipe);
  });

  it('keeps the calendar day unchanged', () => {
    expect(pipe.transform('2026-09-15')).toBe('15 sep 2026');
    expect(pipe.transform('2026-09-01', 'd MMMM y')).toBe('1 september 2026');
  });

  it('returns null for missing or invalid date-only values', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform('')).toBeNull();
    expect(pipe.transform('2026-02-30')).toBeNull();
    expect(pipe.transform('not-a-date')).toBeNull();
  });
});
