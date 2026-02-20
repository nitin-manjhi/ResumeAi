import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UserProfile } from './auth.service';

export interface UpgradeRequest {
    id: number;
    userId: number;
    username: string;
    userEmail: string;
    reason: string;
    status: string;
    createdAt: string;
}

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/admin';

    getAllUsers() {
        return this.http.get<UserProfile[]>(`${this.baseUrl}/users`);
    }

    updateUserUsage(userId: number, analysisCount: number, generationCount: number, usageLimit: number, role: string) {
        let params = new HttpParams();
        if (analysisCount !== null) params = params.set('analysisCount', analysisCount.toString());
        if (generationCount !== null) params = params.set('generationCount', generationCount.toString());
        if (usageLimit !== null) params = params.set('usageLimit', usageLimit.toString());
        if (role !== null) params = params.set('role', role);

        return this.http.put<any>(`${this.baseUrl}/users/${userId}/usage`, null, { params });
    }

    getPendingUpgradeRequests() {
        return this.http.get<UpgradeRequest[]>(`${this.baseUrl}/upgrade-requests`);
    }

    processUpgradeRequest(requestId: number, status: string, newLimit?: number) {
        let params = new HttpParams().set('status', status);
        if (newLimit !== undefined) params = params.set('newLimit', newLimit.toString());
        return this.http.put(`${this.baseUrl}/upgrade-requests/${requestId}`, null, { params });
    }

    createUpgradeRequest(reason: string) {
        let params = new HttpParams().set('reason', reason);
        return this.http.post(`/api/auth/upgrade-requests`, null, { params });
    }
}
