import { inject, Injectable, signal, effect, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, finalize } from 'rxjs';

export interface UserProfile {
    id: number;
    username: string;
    name: string;
    email: string;
    usageLimit: number;
    generationLimit: number;
    analysisCount: number;
    generationCount: number;
    role: string;
    premiumActive: boolean;
    premiumUsageLimit: number;
    premiumUsageCount: number;
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
    private readonly baseUrl = '/api/auth';

    // Use a signal to track authentication state
    private readonly _isLoggedIn = signal<boolean>(this.checkAuth());
    isLoggedIn = this._isLoggedIn.asReadonly();

    private readonly _currentUser = signal<UserProfile | null>(this.getStoredUser());
    currentUser = this._currentUser.asReadonly();

    private refreshTimer: any;
    readonly usageUpgraded$ = new EventEmitter<void>();

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
        return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
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
        return this.http.post<{ message: string }>(`${this.baseUrl}/signup`, userData);
    }

    forgotPassword(email: string) {
        return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, { email });
    }

    logout() {
        return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
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
        return this.http.get<AuthResponse>(`${this.baseUrl}/refresh`).pipe(
            tap(response => {
                if (response.token) {
                    const oldLimit = this._currentUser()?.usageLimit || 0;
                    const newLimit = response.user.usageLimit;

                    localStorage.setItem('auth_token', response.token);
                    localStorage.setItem('user_profile', JSON.stringify(response.user));
                    this._currentUser.set(response.user);

                    if (newLimit > oldLimit && oldLimit !== 0) {
                        this.usageUpgraded$.emit();
                    }
                }
            })
        );
    }

    getUserProfile() {
        return this.http.get<UserProfile>(`${this.baseUrl}/profile`).pipe(
            tap(user => {
                const oldLimit = this._currentUser()?.usageLimit || 0;
                localStorage.setItem('user_profile', JSON.stringify(user));
                this._currentUser.set(user);

                if (user.usageLimit > oldLimit && oldLimit !== 0) {
                    this.usageUpgraded$.emit();
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
