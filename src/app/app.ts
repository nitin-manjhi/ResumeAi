import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuItem, SharedModule } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { AuthService } from './service/auth.service';
import { CommonModule } from '@angular/common';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Menubar, ButtonModule, SharedModule, Toast],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  protected readonly title = signal('ResumeAi');
  isLoggedIn = this.authService.isLoggedIn;
  currentUser = this.authService.currentUser;

  constructor() {
    this.authService.usageUpgraded$.subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Usage Upgraded',
        detail: `Congratulations! Your usage limit has been increased to ${this.currentUser()?.usageLimit}.`,
        life: 5000
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
      }
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
}
