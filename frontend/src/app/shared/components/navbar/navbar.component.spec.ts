import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { KisanTokenPayload, KisanProfile } from '../../../core/models/auth.models';

const mockUser: KisanTokenPayload = { sub: 'user-1', exp: 9999999999, iat: 1700000000 };
const mockProfile: KisanProfile = {
  first_name: 'Ramu', last_name: 'Singh', mobile: '', country: 'India',
  country_code: '+91', state: 'UP', city: 'Lucknow', email: 'ramu@example.com',
  is_email_verified: true, user_id: 1, image_url: '', category: '',
  whatsapp_opt_in_status: false,
};

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let component: NavbarComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService> & { currentUser$: BehaviorSubject<KisanTokenPayload | null> };
  let profileServiceSpy: jasmine.SpyObj<ProfileService> & { currentProfile$: BehaviorSubject<KisanProfile | null> };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['logout']);
    (authSpy as any).currentUser$ = new BehaviorSubject<KisanTokenPayload | null>(null);

    const profileSpy = jasmine.createSpyObj('ProfileService', ['clear']);
    (profileSpy as any).currentProfile$ = new BehaviorSubject<KisanProfile | null>(null);

    authServiceSpy    = authSpy as any;
    profileServiceSpy = profileSpy as any;

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService,    useValue: authServiceSpy },
        { provide: ProfileService, useValue: profileServiceSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not render nav when user is not authenticated', () => {
    authServiceSpy.currentUser$.next(null);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeNull();
  });

  it('renders nav when user is authenticated', () => {
    authServiceSpy.currentUser$.next(mockUser);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeTruthy();
  });

  it('shows profile name when profile is loaded', () => {
    authServiceSpy.currentUser$.next(mockUser);
    profileServiceSpy.currentProfile$.next(mockProfile);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ramu Singh');
  });

  it('shows "Farmer" fallback when profile is not loaded', () => {
    authServiceSpy.currentUser$.next(mockUser);
    profileServiceSpy.currentProfile$.next(null);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Farmer');
  });

  it('calls profileService.clear() and authService.logout() on logout', () => {
    component.logout();
    expect(profileServiceSpy.clear).toHaveBeenCalled();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});
