import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AtsAnalysisResult } from '../shared/modal/ats-analysis-result';


@Injectable({
  providedIn: 'root',
})
export class ResumeAnalysisService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080';

  analyzeResume(file: File, jdText: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jdText', jdText);
    return this.http.post<AtsAnalysisResult>(`${this.baseUrl}/analyze`, formData);
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

  sendEmail(formData: FormData) {
    return this.http.post(`${this.baseUrl}/send-email`, formData);
  }
}
