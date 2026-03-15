import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { JobApplication, PaginatedResponse } from '../shared/modal/job-application';
import { tap } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class JobApplicationService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/job-applications';

    private readonly _applications = signal<JobApplication[]>([]);
    readonly applications = this._applications.asReadonly();

    getAllApplications() {
        return this.http.get<PaginatedResponse<JobApplication>>(this.baseUrl).pipe(
            tap(res => this._applications.set(res.content))
        );
    }

    getPaginatedApplications(page: number, size: number, sortField?: string, sortOrder?: number, search?: string, status?: string) {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (sortField) {
            const order = sortOrder === 1 ? 'asc' : 'desc';
            params = params.set('sort', `${sortField},${order}`);
        }

        if (search) {
            params = params.set('search', search);
        }

        if (status) {
            params = params.set('status', status);
        }

        return this.http.get<PaginatedResponse<JobApplication>>(this.baseUrl, { params });
    }

    createApplication(app: JobApplication) {
        return this.http.post<JobApplication>(this.baseUrl, app).pipe(
            tap(newApp => this._applications.update(apps => [...apps, newApp]))
        );
    }

    updateApplication(id: number, app: JobApplication) {
        return this.http.put<JobApplication>(`${this.baseUrl}/${id}`, app).pipe(
            tap(updatedApp => this._applications.update(apps =>
                apps.map(a => a.id === id ? updatedApp : a)
            ))
        );
    }

    deleteApplication(id: number) {
        return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
            tap(() => this._applications.update(apps => apps.filter(a => a.id !== id)))
        );
    }

    exportApplications() {
        return this.http.get<JobApplication[]>(`${this.baseUrl}/export`);
    }

    importApplications(apps: JobApplication[]) {
        return this.http.post<void>(`${this.baseUrl}/import`, apps);
    }

    getAnalysisResult(jobId: number) {
        return this.http.get<any>(`${this.baseUrl}/${jobId}/analysis-result`);
    }
}
