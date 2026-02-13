import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'http://localhost:8080';

    // Use a signal to track authentication state
    private readonly _isLoggedIn = signal<boolean>(this.checkAuth());
    isLoggedIn = this._isLoggedIn.asReadonly();

    private checkAuth(): boolean {
        return !!localStorage.getItem('auth_token');
    }

    login(credentials: any) {
        return this.http.post<{ token: string }>(`${this.baseUrl}/login`, credentials).pipe(
            tap(response => {
                if (response.token) {
                    localStorage.setItem('auth_token', response.token);
                    this._isLoggedIn.set(true);
                }
            })
        );
    }

    register(userData: any) {
        return this.http.post<{ message: string }>(`${this.baseUrl}/register`, userData);
    }

    logout() {
        localStorage.removeItem('auth_token');
        this._isLoggedIn.set(false);
    }
}
