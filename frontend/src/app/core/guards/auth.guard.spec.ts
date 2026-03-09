import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockRoute = {} as ActivatedRouteSnapshot;

  function runGuard(url: string) {
    const mockState = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
  }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy(),
            createUrlTree: (commands: any[], extras: any) => ({ commands, extras } as any),
          },
        },
      ],
    });

  });

  it('returns true when user is authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    expect(runGuard('/')).toBeTrue();
  });

  it('returns a UrlTree redirecting to /login when not authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    const result = runGuard('/advisories') as UrlTree;
    expect(result).toBeTruthy();
    // UrlTree created with /login and redirect query param
    const tree = result as any;
    expect(tree.commands).toEqual(['/login']);
    expect(tree.extras.queryParams.redirect).toBe('/advisories');
  });

  it('preserves the intended URL in the redirect param', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    const result = runGuard('/ask-expert') as any;
    expect(result.extras.queryParams.redirect).toBe('/ask-expert');
  });
});
