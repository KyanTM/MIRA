import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttentionList } from './attention-list';

describe('AttentionList', () => {
  let component: AttentionList;
  let fixture: ComponentFixture<AttentionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttentionList],
    }).compileComponents();

    fixture = TestBed.createComponent(AttentionList);
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('generatedAt', '2026-08-29T10:00:00Z');
    fixture.componentRef.setInput('attentionThrough', '2026-09-28');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('describes dates relative to the generated dashboard date', () => {
    expect(component.relativeDate('2026-08-28')).toBe('1 dag te laat');
    expect(component.relativeDate('2026-08-29')).toBe('Vandaag');
    expect(component.relativeDate('2026-08-30')).toBe('Morgen');
    expect(component.relativeDate('2026-09-02')).toBe('Over 4 dagen');
  });

  it('shows a meaningful empty state', () => {
    expect(fixture.nativeElement.textContent).toContain('Geen aandachtspunten');
  });
});
