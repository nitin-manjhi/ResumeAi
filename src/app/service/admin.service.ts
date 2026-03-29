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

export interface PasswordResetRequest {
    id: number;
    userId: number;
    username: string;
    requestedAt: string;
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

    getPendingUsers() {
        return this.http.get<UserProfile[]>(`${this.baseUrl}/users/pending`);
    }

    approveUser(userId: number) {
        return this.http.post(`${this.baseUrl}/users/${userId}/approve`, null, { responseType: 'text' });
    }

    rejectUser(userId: number) {
        return this.http.delete(`${this.baseUrl}/users/${userId}/reject`, { responseType: 'text' });
    }

    getPendingPasswordResets() {
        return this.http.get<PasswordResetRequest[]>(`${this.baseUrl}/users/password-resets`);
    }

    approvePasswordReset(requestId: number) {
        return this.http.post(`${this.baseUrl}/users/password-resets/${requestId}/approve`, null, { responseType: 'text' });
    }

    rejectPasswordReset(requestId: number) {
        return this.http.delete(`${this.baseUrl}/users/password-resets/${requestId}/reject`, { responseType: 'text' });
    }

    updateUserUsage(userId: number, analysisCount: number, generationCount: number, usageLimit: number, role: string, premiumActive: boolean, premiumUsageLimit: number, premiumUsageCount: number, suspended: boolean) {
        let params = new HttpParams();
        if (analysisCount !== null) params = params.set('analysisCount', analysisCount.toString());
        if (generationCount !== null) params = params.set('generationCount', generationCount.toString());
        if (usageLimit !== null) params = params.set('usageLimit', usageLimit.toString());
        if (role !== null) params = params.set('role', role);
        if (premiumActive !== null) params = params.set('premiumActive', premiumActive.toString());
        if (premiumUsageLimit !== null) params = params.set('premiumUsageLimit', premiumUsageLimit.toString());
        if (premiumUsageCount !== null) params = params.set('premiumUsageCount', premiumUsageCount.toString());
        if (suspended !== null) params = params.set('suspended', suspended.toString());

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

    deleteUser(userId: number) {
        return this.http.delete<void>(`${this.baseUrl}/users/${userId}`);
    }

    requestUnsuspension() {
        return this.http.post<void>(`/api/auth/request-unsuspension`, {});
    }

    backupDatabase() {
        return this.http.post<string>(`${this.baseUrl}/db/backup`, null, { responseType: 'text' as 'json' });
    }

    restoreDatabase(filePath: string) {
        let params = new HttpParams().set('backupFilePath', filePath);
        return this.http.post<string>(`${this.baseUrl}/db/restore`, null, { 
            params,
            responseType: 'text' as 'json' 
        });
    }

    uploadAndRestoreDatabase(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<string>(`${this.baseUrl}/db/restore-upload`, formData, { 
            responseType: 'text' as 'json' 
        });
    }
}
