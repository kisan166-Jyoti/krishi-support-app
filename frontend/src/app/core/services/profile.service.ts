import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KisanProfile } from '../models/auth.models';
import { AuthService } from './auth.service';

interface ProfileResponse {
  message: string;
  data: KisanProfile;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly PROFILE_KEY = 'kisan_profile';

  currentProfile$ = new BehaviorSubject<KisanProfile | null>(this.loadProfile());

  constructor(private http: HttpClient, private authService: AuthService) {}

  // See oauth-integration.md → Step 4: Fetch User Profile After Login
  fetchProfile() {
    const userId = this.authService.getUserId();
    return this.http
      .get<ProfileResponse>(`${environment.kisanApiBaseUrl}/${userId}/profile`)
      .pipe(
        tap(res => {
          localStorage.setItem(this.PROFILE_KEY, JSON.stringify(res.data));
          this.currentProfile$.next(res.data);
        })
      );
  }

  clear(): void {
    localStorage.removeItem(this.PROFILE_KEY);
    this.currentProfile$.next(null);
  }

  private loadProfile(): KisanProfile | null {
    const stored = localStorage.getItem(this.PROFILE_KEY);
    if (!stored) return null;
    try { return JSON.parse(stored); } catch { return null; }
  }
}
