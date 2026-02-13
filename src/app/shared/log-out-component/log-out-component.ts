import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-log-out-component',
  standalone: true,
  imports: [],
  template: '',
})
export class LogOutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if the backend call fails, we should still logout locally
        this.router.navigate(['/login']);
      }
    });
  }
}
