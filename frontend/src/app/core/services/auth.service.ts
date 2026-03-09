import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KisanTokenPayload, KisanTokens } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly KEYS = {
    accessToken:    'access_token',
    idToken:        'id_token',
    refreshToken:   'refresh_token',
    expiresAt:      'expires_at',
    idTokenPayload: 'id_token_payload',
    userId:         'user_id',
    pkceVerifier:   'pkce_code_verifier',
    oauthState:     'oauth_state',
  };

  currentUser$ = new BehaviorSubject<KisanTokenPayload | null>(this.loadPayload());

  constructor(private router: Router) {}

  // See oauth-integration.md → Step 1: Generate PKCE Code Verifier and Challenge
  private generateCodeVerifier(length = 128): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async computeCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // See oauth-integration.md → Step 5: Decode and Store Tokens
  decodeJwt(token: string): KisanTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  }

  // See oauth-integration.md → Step 2: Save State and Redirect to OAuth Server
  async startLogin(redirectTo = '/'): Promise<void> {
    const verifier = this.generateCodeVerifier();
    const challenge = await this.computeCodeChallenge(verifier);

    sessionStorage.setItem(this.KEYS.pkceVerifier, verifier);
    sessionStorage.setItem(this.KEYS.oauthState, redirectTo);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: environment.kisanClientId,
      code_challenge: challenge,
      state: redirectTo,
    });

    window.location.replace(`${environment.kisanOAuthUiUrl}?${params}`);
  }

  // See oauth-integration.md → Step 3 & 4: Handle Callback + Exchange Code for Tokens
  async handleCallback(): Promise<string> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const authKey = params.get('auth_progress_id');
    const state = params.get('state');

    if (!code || !authKey) throw new Error('Missing authorization parameters');

    const savedState = sessionStorage.getItem(this.KEYS.oauthState);
    if (state !== savedState) throw new Error('State mismatch – possible CSRF attack');

    const verifier = sessionStorage.getItem(this.KEYS.pkceVerifier);
    if (!verifier) throw new Error('Missing PKCE code verifier');

    const response = await fetch(`${environment.kisanOAuthApiUrl}challenge/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'farmer_signin',
        challenge_name: 'code_exchange',
        challenge_data: {
          auth_progress_id: authKey,
          grant_type: 'authorization_code',
          code,
          code_verifier: verifier,
        },
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.data?.tokens) {
      throw new Error(result.message || 'Token exchange failed');
    }

    // Clean up temporary PKCE data
    sessionStorage.removeItem(this.KEYS.pkceVerifier);
    sessionStorage.removeItem(this.KEYS.oauthState);

    this.storeTokens(result.data.tokens);
    return state || '/';
  }

  // See oauth-integration.md → Step 5: Decode and Store Tokens
  private storeTokens(tokens: KisanTokens): void {
    const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;
    localStorage.setItem(this.KEYS.accessToken,    tokens.access_token);
    localStorage.setItem(this.KEYS.idToken,        tokens.id_token);
    localStorage.setItem(this.KEYS.refreshToken,   tokens.refresh_token);
    localStorage.setItem(this.KEYS.expiresAt,      expiresAt.toString());

    const payload = this.decodeJwt(tokens.id_token);
    localStorage.setItem(this.KEYS.idTokenPayload, JSON.stringify(payload));
    localStorage.setItem(this.KEYS.userId,         payload.sub);

    this.currentUser$.next(payload);
  }

  // See oauth-integration.md → Session Expiry and Re-authentication
  isAuthenticated(): boolean {
    const idToken   = localStorage.getItem(this.KEYS.idToken);
    const expiresAt = parseInt(localStorage.getItem(this.KEYS.expiresAt) || '0', 10);
    return !!idToken && Math.floor(Date.now() / 1000) < expiresAt;
  }

  // See oauth-integration.md → Step 6: Make Authenticated API Requests
  getToken(): string | null {
    return localStorage.getItem(this.KEYS.idToken);
  }

  getUserId(): string | null {
    return localStorage.getItem(this.KEYS.userId);
  }

  // See oauth-integration.md → Logout
  logout(): void {
    [
      'access_token', 'id_token', 'refresh_token', 'expires_at',
      'id_token_payload', 'user_id', 'kisan_profile',
    ].forEach(k => localStorage.removeItem(k));
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  private loadPayload(): KisanTokenPayload | null {
    const stored = localStorage.getItem(this.KEYS.idTokenPayload);
    if (!stored) return null;
    try { return JSON.parse(stored); } catch { return null; }
  }
}
