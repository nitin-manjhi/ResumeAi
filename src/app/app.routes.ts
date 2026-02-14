import { Routes } from '@angular/router';
import { HomeComponent } from './home/home-component';
import { AnalyseResumeComponent } from './analyse-resume/analyse-resume-component';
import { SendMailComponent } from './send-mail/send-mail-component';
import { LogOutComponent } from './shared/log-out/log-out-component';
import { GenerateResumeComponent } from './generate-resume/generate-resume-component';
import { LoginComponent } from './shared/login/login-component';
import { SignupComponent } from './shared/signup/signup-component';
import { ForgotPasswordComponent } from './shared/forgot-password/forgot-password.component';
import { ProfileComponent } from './shared/profile/profile.component';
import { authGuard } from './service/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'analyse-resume', component: AnalyseResumeComponent, canActivate: [authGuard] },
  { path: 'send-mail', component: SendMailComponent, canActivate: [authGuard] },
  { path: 'logout', component: LogOutComponent },
  { path: 'generate-resume', component: GenerateResumeComponent, canActivate: [authGuard] },
  { path: 'review-cover-letter', loadComponent: () => import('./review-cover-letter/review-cover-letter-component').then(m => m.ReviewCoverLetterComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
