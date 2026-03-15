import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SavedJob } from '../shared/modal/saved-job';

@Injectable({
  providedIn: 'root'
})
export class SavedJobService {
  private http = inject(HttpClient);
  private apiUrl = '/api/saved-jobs';

  getSavedJobs(): Observable<SavedJob[]> {
    return this.http.get<SavedJob[]>(this.apiUrl);
  }

  saveJob(job: Partial<SavedJob>): Observable<SavedJob> {
    return this.http.post<SavedJob>(this.apiUrl, job);
  }

  deleteSavedJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
