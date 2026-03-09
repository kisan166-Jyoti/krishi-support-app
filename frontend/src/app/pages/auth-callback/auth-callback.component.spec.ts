import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthCallbackComponent } from './auth-callback.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';

describe('AuthCallbackComponent', () => {
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy  = jasmine.createSpyObj('AuthService', ['handleCallback']);
    profileServiceSpy = jasmine.createSpyObj('ProfileService', ['fetchProfile']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: AuthService,    useValue: authServiceSpy },
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: Router,         useValue: routerSpy },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    authServiceSpy.handleCallback.and.returnValue(Promise.resolve('/'));
    profileServiceSpy.fetchProfile.and.returnValue(of({} as any));
    fixture = TestBed.createComponent(AuthCallbackComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('navigates to redirect path after successful callback and profile fetch', async () => {
    authServiceSpy.handleCallback.and.returnValue(Promise.resolve('/advisories'));
    profileServiceSpy.fetchProfile.and.returnValue(of({} as any));

    fixture = TestBed.createComponent(AuthCallbackComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/advisories');
  });

  it('still navigates even if profile fetch fails', async () => {
    authServiceSpy.handleCallback.and.returnValue(Promise.resolve('/'));
    profileServiceSpy.fetchProfile.and.returnValue(throwError(() => new Error('Profile error')));

    fixture = TestBed.createComponent(AuthCallbackComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('sets error message when handleCallback rejects', async () => {
    authServiceSpy.handleCallback.and.returnValue(Promise.reject(new Error('State mismatch')));
    profileServiceSpy.fetchProfile.and.returnValue(of({} as any));

    fixture = TestBed.createComponent(AuthCallbackComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.error).toBe('State mismatch');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('State mismatch');
  });
});
