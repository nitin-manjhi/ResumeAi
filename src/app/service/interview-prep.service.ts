import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface InterviewQuestion {
  topic: string;
  question: string;
  technicalExpectation: string;
  goldenAnswer: string;
}

export interface InterviewPrepHistoryItem {
  id: string;
  companyName: string;
  role: string;
  experience: string;
  domain: string;
  type: string;
  model: string;
  generatedContent: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class InterviewPrepService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/interview-prep';

  // Streaming state
  private readonly _isStreaming = signal<boolean>(false);
  readonly isStreaming = this._isStreaming.asReadonly();

  private readonly _streamedContent = signal<string>('');
  readonly streamedContent = this._streamedContent.asReadonly();

  private readonly _isComplete = signal<boolean>(false);
  readonly isComplete = this._isComplete.asReadonly();

  private readonly _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();

  // Structured content
  private readonly _questions = signal<InterviewQuestion[]>([]);
  readonly questions = this._questions.asReadonly();

  // History
  private readonly _history = signal<InterviewPrepHistoryItem[]>([]);
  readonly history = this._history.asReadonly();

  private readonly _loadingHistory = signal<boolean>(false);
  readonly loadingHistory = this._loadingHistory.asReadonly();

  generateQuestions(
    file: File,
    companyName: string,
    role: string,
    experience: string,
    domain: string,
    jdText: string,
    model: string,
    type: string,
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyName', companyName);
    formData.append('role', role);
    formData.append('experience', experience);
    formData.append('domain', domain || '');
    formData.append('jdText', jdText);
    formData.append('model', model);
    formData.append('type', type);

    this.resetStream();
    this._isStreaming.set(true);

    return this.http.post(`${this.baseUrl}/generate`, formData);
  }

  addQuestion(question: InterviewQuestion) {
    this._questions.update(current => [...current, question]);
  }

  appendToken(token: string) {
    this._streamedContent.update((prev) => prev + token);
  }

  completeStream(questionsFromServer?: InterviewQuestion[]) {
    this._isStreaming.set(false);
    this._isComplete.set(true);
    
    if (questionsFromServer && Array.isArray(questionsFromServer)) {
      this._questions.set(questionsFromServer);
    } else {
      // Fallback: try to parse the buffered content
      const parsed = this.parseQuestions(this._streamedContent());
      this._questions.set(parsed);
    }
    
    this.loadHistory();
  }

  handleError(message: string) {
    this._isStreaming.set(false);
    this._error.set(message);
  }

  resetStream() {
    this._isStreaming.set(false);
    this._streamedContent.set('');
    this._isComplete.set(false);
    this._error.set(null);
    this._questions.set([]);
  }

  deleteResult(id: string) {
    return this.http.delete(`${this.baseUrl}/result/${id}`);
  }

  loadHistory() {
    this._loadingHistory.set(true);
    this.http.get<InterviewPrepHistoryItem[]>(`${this.baseUrl}/history`).subscribe({
      next: (items) => {
        this._history.set(items);
        this._loadingHistory.set(false);
      },
      error: () => this._loadingHistory.set(false),
    });
  }

  viewHistoryItem(item: InterviewPrepHistoryItem) {
    this.resetStream();
    try {
      const parsed = JSON.parse(item.generatedContent);
      this._questions.set(parsed);
    } catch (e) {
      // Fallback for old history items
      this._questions.set(this.parseQuestions(item.generatedContent));
    }
    this._isComplete.set(true);
    this._streamedContent.set(item.generatedContent);
  }

  private parseQuestions(content: string): InterviewQuestion[] {
    if (!content) return [];
    
    content = content.trim();
    
    // Check if it looks like JSON array
    if (content.startsWith('[') || content.includes('[{')) {
      try {
        // Strip markdown if present
        let json = content;
        if (json.includes('```')) {
          json = json.replace(/```json|```/g, '').trim();
        }
        
        // Find boundaries
        const start = json.indexOf('[');
        const end = json.lastIndexOf(']');
        if (start >= 0 && end > start) {
           return JSON.parse(json.substring(start, end + 1));
        }
      } catch (e) {
        console.warn("Partial JSON parse failed", e);
      }
    }

    // Fallback: Old regex parser for legacy items
    const questions: InterviewQuestion[] = [];
    const blocks = content.split(/(?=Topic\s*:)/i).filter((b) => b.trim());

    for (const block of blocks) {
      const topicMatch = block.match(/Topic\s*:\s*(.+?)(?=\n|Question\s*:)/is);
      const questionMatch = block.match(/Question\s*:\s*(.+?)(?=\n\s*Technical Expectation\s*:|$)/is);
      const expectationMatch = block.match(/Technical Expectation\s*:\s*(.+?)(?=\n\s*Golden Answer\s*:|$)/is);
      const answerMatch = block.match(/Golden Answer\s*:\s*(.+?)(?=\n\s*Topic\s*:|$)/is);

      if (topicMatch || questionMatch) {
        questions.push({
          topic: topicMatch?.[1]?.trim() || 'General',
          question: questionMatch?.[1]?.trim() || '',
          technicalExpectation: expectationMatch?.[1]?.trim() || '',
          goldenAnswer: answerMatch?.[1]?.trim() || '',
        });
      }
    }
    return questions;
  }
}
