import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('accepts eight characters without composition rules and rejects seven', () => {
    const password = component.registerForm.controls.password;
    for (const value of ['Abcdef12', 'abcdefgh', 'ABCDEFGH', '12345678', 'abababab']) {
      password.setValue(value);
      expect(password.valid).toBe(true);
    }
    password.setValue('Abcde12');
    expect(password.hasError('minlength')).toBe(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
