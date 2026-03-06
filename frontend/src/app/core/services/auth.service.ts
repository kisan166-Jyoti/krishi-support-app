import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'krishi_token';
  private readonly USER_KEY = 'krishi_user';
  private readonly API = 'http://localhost:5000/api/auth';

  currentUser$ = new BehaviorSubject<User | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.API}/login`, { email, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  register(name: string, email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.API}/register`, { name, email, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private setSession(res: AuthResponse) {
    sessionStorage.setItem(this.TOKEN_KEY, res.token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser$.next(res.user);
  }

  private loadUser(): User | null {
    const stored = sessionStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
