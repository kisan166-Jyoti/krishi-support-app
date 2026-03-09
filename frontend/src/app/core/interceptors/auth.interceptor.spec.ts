import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  function setup(token: string | null) {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    authServiceSpy.getToken.and.returnValue(token);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches Authorization header when token exists', () => {
    setup('my-id-token');
    http.get('/api/crops').subscribe();
    const req = httpMock.expectOne('/api/crops');
    expect(req.request.headers.get('Authorization')).toBe('my-id-token');
    req.flush([]);
  });

  it('does not attach Authorization header when token is null', () => {
    setup(null);
    http.get('/api/crops').subscribe();
    const req = httpMock.expectOne('/api/crops');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('skips Authorization header for token-exchange (challenge/) endpoint', () => {
    setup('my-id-token');
    http.post('https://api.kisan.io/challenge/', {}).subscribe();
    const req = httpMock.expectOne('https://api.kisan.io/challenge/');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('calls logout on 401 response', () => {
    setup('expired-token');
    http.get('/api/queries').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/queries');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});
