import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── isAuthenticated ────────────────────────────────────────────────────────

  describe('isAuthenticated()', () => {
    it('returns false when no token is stored', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('returns false when token exists but is expired', () => {
      localStorage.setItem('id_token', 'sometoken');
      localStorage.setItem('expires_at', '1000'); // far in the past
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('returns true when token exists and is not expired', () => {
      localStorage.setItem('id_token', 'sometoken');
      localStorage.setItem('expires_at', String(Math.floor(Date.now() / 1000) + 3600));
      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  // ── getToken / getUserId ───────────────────────────────────────────────────

  describe('getToken()', () => {
    it('returns null when not authenticated', () => {
      expect(service.getToken()).toBeNull();
    });

    it('returns the stored id_token', () => {
      localStorage.setItem('id_token', 'my-token');
      expect(service.getToken()).toBe('my-token');
    });
  });

  describe('getUserId()', () => {
    it('returns null when not stored', () => {
      expect(service.getUserId()).toBeNull();
    });

    it('returns the stored user_id', () => {
      localStorage.setItem('user_id', 'user-42');
      expect(service.getUserId()).toBe('user-42');
    });
  });

  // ── decodeJwt ──────────────────────────────────────────────────────────────

  describe('decodeJwt()', () => {
    it('correctly decodes a valid JWT payload', () => {
      const payload = { sub: 'user-1', exp: 9999999999, iat: 1700000000 };
      const encoded = btoa(JSON.stringify(payload)).replace(/=/g, '');
      const token = `header.${encoded}.signature`;
      const decoded = service.decodeJwt(token);
      expect(decoded.sub).toBe('user-1');
      expect(decoded.exp).toBe(9999999999);
    });

    it('throws an error for an invalid JWT format', () => {
      expect(() => service.decodeJwt('not-a-jwt')).toThrow();
    });

    it('throws for a token with only two parts', () => {
      expect(() => service.decodeJwt('header.payload')).toThrow();
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('clears all auth keys from localStorage', () => {
      ['access_token', 'id_token', 'refresh_token', 'expires_at',
       'id_token_payload', 'user_id', 'kisan_profile'].forEach(k =>
        localStorage.setItem(k, 'value')
      );
      service.logout();
      ['access_token', 'id_token', 'refresh_token', 'expires_at',
       'id_token_payload', 'user_id', 'kisan_profile'].forEach(k =>
        expect(localStorage.getItem(k)).toBeNull()
      );
    });

    it('emits null on currentUser$', () => {
      service.logout();
      service.currentUser$.subscribe(user => expect(user).toBeNull());
    });

    it('navigates to /login', () => {
      service.logout();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ── currentUser$ ───────────────────────────────────────────────────────────

  describe('currentUser$', () => {
    it('emits null when no payload is stored', () => {
      service.currentUser$.subscribe(user => expect(user).toBeNull());
    });
  });
});
