import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css'
})
export class AuthCallbackComponent implements OnInit {
  error = '';

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      // See oauth-integration.md → Step 3 & 4: Handle Callback + Exchange Code
      const redirectTo = await this.authService.handleCallback();

      // See oauth-integration.md → Step 4: Fetch User Profile After Login
      this.profileService.fetchProfile().subscribe({
        next: () => this.router.navigateByUrl(redirectTo),
        error: () => this.router.navigateByUrl(redirectTo), // proceed even if profile fetch fails
      });
    } catch (err: unknown) {
      this.error = err instanceof Error ? err.message : 'Authentication failed';
    }
  }
}
