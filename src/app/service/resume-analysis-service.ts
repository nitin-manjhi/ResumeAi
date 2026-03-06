import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AtsAnalysisResult } from '../shared/modal/ats-analysis-result';
import { tap } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class ResumeAnalysisService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  private readonly _currentResult = signal<AtsAnalysisResult | null>(null);
  readonly currentResult = this._currentResult.asReadonly();

  private readonly _isAnalyzing = signal<boolean>(false);
  readonly isAnalyzing = this._isAnalyzing.asReadonly();

  private readonly _lastJobId = signal<string | null>(null);
  readonly lastJobId = this._lastJobId.asReadonly();

  setResult(result: AtsAnalysisResult) {
    this._currentResult.set(result);
  }

  clearResult() {
    this._currentResult.set(null);
    this._isAnalyzing.set(false);
    this._lastJobId.set(null);
  }

  setAnalyzing(status: boolean, jobId: string | null = null) {
    this._isAnalyzing.set(status);
    if (jobId) this._lastJobId.set(jobId);
  }

  analyzeResume(file: File, jdText: string, model: string = 'ollama') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jdText', jdText);
    formData.append('model', model);
    return this.http.post<AtsAnalysisResult>(`${this.baseUrl}/analyze`, formData);
  }

  getAnalysisResult(resultId: string) {
    return this.http.get<AtsAnalysisResult>(`${this.baseUrl}/analysis-result/${resultId}`).pipe(
      tap(result => this._currentResult.set(result))
    );
  }

  downloadResume(id: string) {
    return this.http.get(`${this.baseUrl}/result/${id}/resume-onepage`, {
      responseType: 'blob',
    });
  }

  downloadCoverLetter(id: string) {
    return this.http.get(`${this.baseUrl}/result/${id}/cover-letter`, {
      responseType: 'blob',
    });
  }

  trackGeneration() {
    return this.http.post(`${this.baseUrl}/track-generation`, {});
  }

  categorizeSkills(skills: string[]) {
    return this.http.post<any>(`${this.baseUrl}/categorize-skills`, skills);
  }
}
