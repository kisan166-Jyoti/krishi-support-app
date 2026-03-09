import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  menuOpen = false;

  constructor(
    public authService: AuthService,
    public profileService: ProfileService
  ) {}

  logout() {
    this.authService.logout();
  }
}
