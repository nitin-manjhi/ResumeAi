import { Routes } from '@angular/router';
import { HomeComponent } from './home/home-component';
import { AnalyseResumeComponent } from './analyse-resume/analyse-resume-component';
import { SendMailComponent } from './send-mail/send-mail-component';
import { LogOutComponent } from './shared/log-out-component/log-out-component';
import { GenerateResumeComponent } from './generate-resume/generate-resume-component';
import { LoginComponent } from './login/login-component';
import { SignupComponent } from './signup/signup-component';
import { authGuard } from './service/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'analyse-resume', component: AnalyseResumeComponent, canActivate: [authGuard] },
  { path: 'send-mail', component: SendMailComponent, canActivate: [authGuard] },
  { path: 'logout', component: LogOutComponent },
  { path: 'generate-resume', component: GenerateResumeComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
