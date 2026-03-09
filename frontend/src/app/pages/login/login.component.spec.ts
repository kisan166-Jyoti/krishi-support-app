import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { of } from 'rxjs';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['startLogin']);
    authServiceSpy.startLogin.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: (_: string) => null } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('calls startLogin with default redirect "/" on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(authServiceSpy.startLogin).toHaveBeenCalledWith('/');
  });

  it('calls startLogin with redirect param when present', async () => {
    const redirectAuthSpy = jasmine.createSpyObj('AuthService', ['startLogin']);
    redirectAuthSpy.startLogin.and.returnValue(Promise.resolve());

    await TestBed.resetTestingModule().configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: redirectAuthSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: (_: string) => '/advisories' } },
          },
        },
      ],
    }).compileComponents();

    const redirectFixture = TestBed.createComponent(LoginComponent);
    redirectFixture.detectChanges();
    await redirectFixture.whenStable();
    expect(redirectAuthSpy.startLogin).toHaveBeenCalledWith('/advisories');
  });

  it('shows error message when startLogin rejects', async () => {
    authServiceSpy.startLogin.and.returnValue(Promise.reject(new Error('Network error')));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Network error');
  });
});
