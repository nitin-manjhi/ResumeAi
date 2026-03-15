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

  private readonly _isGeneratingCL = signal<boolean>(false);
  readonly isGeneratingCL = this._isGeneratingCL.asReadonly();

  private readonly _isGeneratingEmail = signal<boolean>(false);
  readonly isGeneratingEmail = this._isGeneratingEmail.asReadonly();

  private readonly _preFilledData = signal<{ companyName: string, jdText: string, applicationId?: number } | null>(null);
  readonly preFilledData = this._preFilledData.asReadonly();

  setPreFilledData(data: { companyName: string, jdText: string, applicationId?: number } | null) {
    this._preFilledData.set(data);
  }

  setResult(result: AtsAnalysisResult) {
    this._currentResult.set(result);
  }

  clearResult() {
    this._currentResult.set(null);
    this._isAnalyzing.set(false);
    this._lastJobId.set(null);
    this._isGeneratingCL.set(false);
    this._isGeneratingEmail.set(false);
  }

  setAnalyzing(status: boolean, jobId: string | null = null) {
    this._isAnalyzing.set(status);
    if (jobId) this._lastJobId.set(jobId);
  }

  setGeneratingCL(status: boolean) {
    this._isGeneratingCL.set(status);
  }

  setGeneratingEmail(status: boolean) {
    this._isGeneratingEmail.set(status);
  }

  analyzeResume(file: File, jdText: string, model: string = 'ollama', companyName: string = '', applicationId?: number) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jdText', jdText);
    formData.append('model', model);
    formData.append('companyName', companyName);
    if (applicationId) {
      formData.append('applicationId', applicationId.toString());
    }
    return this.http.post<AtsAnalysisResult>(`${this.baseUrl}/analyze`, formData);
  }

  getAnalysisResult(resultId: string) {
    const current = this._currentResult();
    let params: any = {};

    if (current && current.uuid === resultId) {
      // If we already have some data, only ask for what's missing
      const missingFields = [];
      if (current.score === undefined || current.score === null) missingFields.push('score');
      if (!current.scoreExplanation || current.scoreExplanation.length === 0) missingFields.push('scoreExplanation');
      if (!current.matchedSkills || current.matchedSkills.length === 0) missingFields.push('matchedSkills');
      if (!current.missingSkills || current.missingSkills.length === 0) missingFields.push('missingSkills');
      if (!current.improvementSuggestions || current.improvementSuggestions.length === 0) missingFields.push('improvementSuggestions');
      if (!current.optimizedResume) missingFields.push('optimizedResume');
      if (!current.coverLetter) missingFields.push('coverLetter');
      if (!current.email) missingFields.push('email');

      if (missingFields.length > 0) {
        params.fields = missingFields;
      }
    }

    return this.http.get<AtsAnalysisResult>(`${this.baseUrl}/analysis-result/${resultId}`, { params }).pipe(
      tap(newResult => {
        if (current && current.uuid === resultId) {
          // Merge
          const merged = { ...current };
          Object.keys(newResult).forEach(key => {
            const val = (newResult as any)[key];
            if (val !== null && val !== undefined) {
              (merged as any)[key] = val;
            }
          });
          this._currentResult.set(merged);
        } else {
          // Fresh set
          this._currentResult.set(newResult);
        }
      })
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

  generateCoverLetter(resultId: string, model: string = 'ollama') {
    return this.http.post<string>(`${this.baseUrl}/generate-cover-letter/${resultId}`, null, { params: { model } });
  }

  generateEmail(resultId: string, model: string = 'ollama') {
    return this.http.post<string>(`${this.baseUrl}/generate-email/${resultId}`, null, { params: { model } });
  }

  rewriteSummary(summary: string, model: string = 'ollama') {
    return this.http.post(`${this.baseUrl}/rewrite-summary`, { summary, model }, { responseType: 'text' });
  }
}
