import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuItem, SharedModule } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { ButtonModule, ButtonSeverity } from 'primeng/button';
import { AuthService } from './service/auth.service';
import { CommonModule } from '@angular/common';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';
import { NotificationService } from './service/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Menubar,
    ButtonModule,
    SharedModule,
    Toast,
    Tooltip,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  private authService = inject(AuthService);
  public router = inject(Router);
  private messageService = inject(MessageService);
  public notificationService = inject(NotificationService);

  protected readonly title = signal('ResumeAi');
  isLoggedIn = this.authService.isLoggedIn;
  currentUser = this.authService.currentUser;
  isDarkMode = signal(false);
  isMobile = signal(window.innerWidth < 768);
  readonly lightSeverity: ButtonSeverity = 'secondary';
  readonly darkSeverity: ButtonSeverity = 'primary';

  constructor() {
    this.initTheme();
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
    });
    this.authService.usageUpgraded$.subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Usage Upgraded',
        detail: `Congratulations! Your usage limit has been increased to ${this.currentUser()?.usageLimit}.`,
        life: 5000,
      });
    });
  }

  protected items = computed<MenuItem[] | undefined>(() => {
    if (!this.isLoggedIn()) return undefined;

    const menuItems: MenuItem[] = [
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
      },
      {
        label: 'Job Tracker',
        icon: 'pi pi-list',
        routerLink: '/job-tracker',
      },
      {
        label: 'Job Search',
        icon: 'pi pi-search',
        routerLink: '/job-search',
      },
    ];

    if (this.currentUser()?.role === 'ADMIN') {
      menuItems.push({
        label: 'Admin',
        icon: 'pi pi-cog',
        routerLink: '/admin',
      });
    }

    return menuItems;
  });

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.router.navigate(['/logout']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.setDarkTheme(true);
    } else {
      this.setDarkTheme(false);
    }
  }

  toggleTheme() {
    this.setDarkTheme(!this.isDarkMode());
  }

  private setDarkTheme(isDark: boolean) {
    this.isDarkMode.set(isDark);
    const element = document.documentElement; // More direct than querySelector('html')

    if (isDark) {
      element.classList.add('p-dark');
      localStorage.setItem('theme', 'dark');
    } else {
      element.classList.remove('p-dark');
      localStorage.setItem('theme', 'light');
    }
  }
}
