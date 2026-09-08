import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../core/auth/service';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  let component: AppShell;
  let fixture: ComponentFixture<AppShell>;
  let router: Router;
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    logout = vi.fn(() => of(void 0));

    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1', email: 'test@example.com' }),
            logout,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShell);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('shows the authenticated account and application navigation', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Overzicht');
    expect(text).toContain('Bezittingen');
    expect(text).toContain('Abonnementen');
    expect(text).toContain('test@example.com');
  });

  it('navigates to login after a successful logout', () => {
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.onLogout();

    expect(logout).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('keeps the user in place and reports a failed logout', () => {
    logout.mockReturnValue(throwError(() => new Error('offline')));

    component.onLogout();
    fixture.detectChanges();

    expect(component.logoutError()).toBe('Afmelden is mislukt. Probeer het opnieuw.');
    expect(fixture.nativeElement.textContent).toContain('Afmelden is mislukt');
  });
});
