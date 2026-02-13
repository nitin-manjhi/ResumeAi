import { inject, Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, finalize } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'http://localhost:8080';

    // Use a signal to track authentication state
    private readonly _isLoggedIn = signal<boolean>(this.checkAuth());
    isLoggedIn = this._isLoggedIn.asReadonly();
    private refreshTimer: any;

    constructor() {
        effect(() => {
            if (this.isLoggedIn()) {
                this.startTokenRefresh();
            } else {
                this.stopTokenRefresh();
            }
        });
    }

    private checkAuth(): boolean {
        return !!localStorage.getItem('auth_token');
    }

    login(credentials: any) {
        return this.http.post<{ token: string }>(`${this.baseUrl}/api/auth/login`, credentials).pipe(
            tap(response => {
                if (response.token) {
                    localStorage.setItem('auth_token', response.token);
                    this._isLoggedIn.set(true);
                }
            })
        );
    }

    register(userData: any) {
        return this.http.post<{ message: string }>(`${this.baseUrl}/api/auth/signup`, userData);
    }

    logout() {
        return this.http.post(`${this.baseUrl}/api/auth/logout`, {}).pipe(
            finalize(() => {
                this.stopTokenRefresh();
                localStorage.removeItem('auth_token');
                this._isLoggedIn.set(false);
            })
        );
    }

    refresh() {
        return this.http.get<{ token: string }>(`${this.baseUrl}/api/auth/refresh`).pipe(
            tap(response => {
                if (response.token) {
                    localStorage.setItem('auth_token', response.token);
                }
            })
        );
    }

    private startTokenRefresh() {
        if (this.refreshTimer) return;
        // Refresh every 500 seconds (since it expires in 599s)
        this.refreshTimer = setInterval(() => {
            this.refresh().subscribe({
                error: (err) => {
                    console.error('Token refresh failed', err);
                    this.logout().subscribe();
                }
            });
        }, 500 * 1000);
    }

    private stopTokenRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
}
