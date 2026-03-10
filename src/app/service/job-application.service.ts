import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JobApplication } from '../shared/modal/job-application';
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
        return this.http.get<JobApplication[]>(this.baseUrl).pipe(
            tap(apps => this._applications.set(apps))
        );
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
}
