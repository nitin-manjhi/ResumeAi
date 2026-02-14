import { inject, Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, finalize } from 'rxjs';

export interface UserProfile {
    id: number;
    username: string;
    name: string;
    email: string;
    usageLimit: number;
    analysisCount: number;
    generationCount: number;
}

interface AuthResponse {
    token: string;
    user: UserProfile;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'http://localhost:8080';

    // Use a signal to track authentication state
    private readonly _isLoggedIn = signal<boolean>(this.checkAuth());
    isLoggedIn = this._isLoggedIn.asReadonly();

    private readonly _currentUser = signal<UserProfile | null>(this.getStoredUser());
    currentUser = this._currentUser.asReadonly();

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

    private getStoredUser(): UserProfile | null {
        const user = localStorage.getItem('user_profile');
        return user ? JSON.parse(user) : null;
    }

    login(credentials: any) {
        return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/login`, credentials).pipe(
            tap(response => {
                if (response.token) {
                    localStorage.setItem('auth_token', response.token);
                    localStorage.setItem('user_profile', JSON.stringify(response.user));
                    this._currentUser.set(response.user);
                    this._isLoggedIn.set(true);
                }
            })
        );
    }

    register(userData: any) {
        return this.http.post<{ message: string }>(`${this.baseUrl}/api/auth/signup`, userData);
    }

    forgotPassword(email: string) {
        return this.http.post<{ message: string }>(`${this.baseUrl}/api/auth/forgot-password`, { email });
    }

    logout() {
        return this.http.post(`${this.baseUrl}/api/auth/logout`, {}).pipe(
            finalize(() => {
                this.stopTokenRefresh();
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_profile');
                this._currentUser.set(null);
                this._isLoggedIn.set(false);
            })
        );
    }

    refresh() {
        return this.http.get<AuthResponse>(`${this.baseUrl}/api/auth/refresh`).pipe(
            tap(response => {
                if (response.token) {
                    localStorage.setItem('auth_token', response.token);
                    localStorage.setItem('user_profile', JSON.stringify(response.user));
                    this._currentUser.set(response.user);
                }
            })
        );
    }

    getUserProfile() {
        return this.http.get<UserProfile>(`${this.baseUrl}/api/auth/profile`).pipe(
            tap(user => {
                localStorage.setItem('user_profile', JSON.stringify(user));
                this._currentUser.set(user);
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
