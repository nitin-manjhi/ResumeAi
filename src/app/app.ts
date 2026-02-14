import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuItem, SharedModule } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { AuthService } from './service/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Menubar, ButtonModule, SharedModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected readonly title = signal('ResumeAi');
  isLoggedIn = this.authService.isLoggedIn;
  currentUser = this.authService.currentUser;

  protected items = computed<MenuItem[] | undefined>(() => {
    if (!this.isLoggedIn()) return undefined;

    return [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: '/',
      },
      {
        label: 'Generate Resume',
        icon: 'pi pi-file-edit',
        routerLink: '/generate-resume',
      },
      {
        label: 'Analyse Resume',
        icon: 'pi pi-bolt',
        routerLink: '/analyse-resume',
      }
    ];
  });

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.router.navigate(['/logout']);
  }
}
