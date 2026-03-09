import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AdvisoriesComponent } from './pages/advisories/advisories.component';
import { AdvisoryDetailComponent } from './pages/advisory-detail/advisory-detail.component';
import { AskExpertComponent } from './pages/ask-expert/ask-expert.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login',           component: LoginComponent },
  { path: 'auth/callback',   component: AuthCallbackComponent },
  { path: '',                component: HomeComponent,           canActivate: [authGuard] },
  { path: 'advisories',      component: AdvisoriesComponent,     canActivate: [authGuard] },
  { path: 'advisories/:id',  component: AdvisoryDetailComponent, canActivate: [authGuard] },
  { path: 'ask-expert',      component: AskExpertComponent,      canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
