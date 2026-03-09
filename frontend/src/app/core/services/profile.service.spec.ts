import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileService } from './profile.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { KisanProfile } from '../models/auth.models';

const mockProfile: KisanProfile = {
  first_name: 'Ramu', last_name: 'Singh', mobile: '+911234567890',
  country: 'India', country_code: '+91', state: 'Maharashtra', city: 'Pune',
  email: 'ramu@example.com', is_email_verified: true, user_id: 101,
  image_url: 'https://example.com/pic.jpg', category: 'Farming',
  whatsapp_opt_in_status: true,
};

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);
    authServiceSpy.getUserId.and.returnValue('user-101');

    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
      ],
    });

    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchProfile()', () => {
    it('makes a GET request with the correct URL', () => {
      service.fetchProfile().subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/user-101/profile'));
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'ok', data: mockProfile });
    });

    it('stores profile in localStorage and emits on currentProfile$', () => {
      service.fetchProfile().subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/user-101/profile'));
      req.flush({ message: 'ok', data: mockProfile });

      expect(localStorage.getItem('kisan_profile')).toBeTruthy();
      const stored = JSON.parse(localStorage.getItem('kisan_profile')!);
      expect(stored.first_name).toBe('Ramu');
    });
  });

  describe('clear()', () => {
    it('removes profile from localStorage', () => {
      localStorage.setItem('kisan_profile', JSON.stringify(mockProfile));
      service.clear();
      expect(localStorage.getItem('kisan_profile')).toBeNull();
    });

    it('emits null on currentProfile$', () => {
      service.clear();
      service.currentProfile$.subscribe(p => expect(p).toBeNull());
    });
  });
});
