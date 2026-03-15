import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LinkedInJobDTO, LinkedInJobSearchRequest, LinkedInJobStatusResponse } from '../shared/modal/linkedin-job';

@Injectable({
  providedIn: 'root'
})
export class JobSearchService {
  private http = inject(HttpClient);
  private apiUrl = '/api/scraper';

  // Persistent State
  private readonly _jobs = signal<LinkedInJobDTO[]>([]);
  readonly jobs = this._jobs.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  private readonly _progress = signal(0);
  readonly progress = this._progress.asReadonly();

  private readonly _lastCriteria = signal<LinkedInJobSearchRequest | null>(null);
  readonly lastCriteria = this._lastCriteria.asReadonly();

  searchJobs(request: LinkedInJobSearchRequest): Observable<{jobId: string}> {
    this._loading.set(true);
    this._progress.set(0);
    this._lastCriteria.set(request);
    return this.http.post<{jobId: string}>(`${this.apiUrl}/search`, request);
  }

  getJobStatus(jobId: string): Observable<LinkedInJobStatusResponse> {
    return this.http.get<LinkedInJobStatusResponse>(`${this.apiUrl}/job/${jobId}`);
  }

  getJobDetails(url: string): Observable<LinkedInJobDTO> {
    return this.http.post<LinkedInJobDTO>(`${this.apiUrl}/details`, { url });
  }

  setJobs(jobs: LinkedInJobDTO[]) {
    this._jobs.set(jobs);
  }

  setLoading(status: boolean) {
    this._loading.set(status);
  }

  setProgress(value: number) {
    this._progress.set(value);
  }

  clearSearch() {
    this._jobs.set([]);
    this._loading.set(false);
    this._progress.set(0);
    this._lastCriteria.set(null);
  }
}
