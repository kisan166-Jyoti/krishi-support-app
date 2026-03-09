import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  error = '';

  constructor(private authService: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/';
    // See oauth-integration.md → Step 2: Save State and Redirect to OAuth Server
    this.authService.startLogin(redirect).catch(err => {
      this.error = err.message || 'Could not initiate login. Please try again.';
    });
  }
}
