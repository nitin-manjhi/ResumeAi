import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { InterviewPrepService, InterviewPrepHistoryItem } from '../service/interview-prep.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-interview-preparation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    FileUploadModule,
    SelectModule,
    TabsModule,
    FloatLabelModule,
    ProgressSpinnerModule,
    ToastModule,
    TooltipModule,
  ],
  templateUrl: './interview-preparation.component.html',
  styleUrl: './interview-preparation.component.scss',
})
export class InterviewPreparationComponent {
  private readonly interviewPrepService = inject(InterviewPrepService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  // Form fields
  protected companyName = signal('');
  protected role = signal('');
  protected experience = signal('');
  protected domain = signal('');
  protected jobDescription = signal('');
  protected selectedModel = signal('ollama');
  protected activeTab = signal(0);

  // State
  protected isLoading = signal(false);
  protected isMobile = signal(window.innerWidth < 768);
  protected expandedQuestions = signal<Set<number>>(new Set());
  protected viewingHistoryItem = signal<InterviewPrepHistoryItem | null>(null);

  // Streaming state from service
  protected isStreaming = this.interviewPrepService.isStreaming;
  protected streamedContent = this.interviewPrepService.streamedContent;
  protected isComplete = this.interviewPrepService.isComplete;
  protected streamError = this.interviewPrepService.error;
  protected questions = this.interviewPrepService.questions;

  // History
  protected history = this.interviewPrepService.history;
  protected loadingHistory = this.interviewPrepService.loadingHistory;

  // Computed: Filter history based on active tab type
  protected filteredHistory = computed(() => {
    const type = this.currentTabType();
    return this.history().filter(item => item.type === type);
  });

  // Model options
  protected modelOptions = [
    { label: 'Standard Intelligence', value: 'ollama', icon: 'pi pi-server' },
    { label: 'Advanced AI (Pro)', value: 'openai', icon: 'pi pi-bolt' },
    { label: 'Elite AI (Deep)', value: 'gemini', icon: 'pi pi-sparkles' },
  ];

  // Computed
  protected hasResult = computed(() => this.isStreaming() || this.isComplete() || !!this.streamError());
  protected isFormValid = computed(
    () =>
      this.companyName().trim() !== '' &&
      this.role().trim() !== '' &&
      this.experience().trim() !== '' &&
      this.jobDescription().trim() !== '',
  );

  protected currentTabType = computed(() => (this.activeTab() === 0 ? 'TOPIC_WISE' : 'SCENARIO_BASED'));

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
    });
    // Load history on init
    this.interviewPrepService.loadHistory();
  }

  async onGenerate(fileUpload: any) {
    if (!fileUpload.files || fileUpload.files.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a resume file to upload',
      });
      return;
    }

    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please fill in all required fields',
      });
      return;
    }

    this.isLoading.set(true);
    this.viewingHistoryItem.set(null);
    const file = fileUpload.files[0];

    try {
      await firstValueFrom(
        this.interviewPrepService.generateQuestions(
          file,
          this.companyName(),
          this.role(),
          this.experience(),
          this.domain(),
          this.jobDescription(),
          this.selectedModel(),
          this.currentTabType(),
        ),
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Started',
        detail: 'Interview questions are being generated. Watch them appear in real time!',
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.error?.message || 'Failed to start question generation',
      });
      this.interviewPrepService.resetStream();
    } finally {
      this.isLoading.set(false);
    }
  }

  onReset() {
    this.interviewPrepService.resetStream();
    this.viewingHistoryItem.set(null);
    this.expandedQuestions.set(new Set());
  }

  onTabChange(event: any) {
    this.activeTab.set(event.index ?? 0);
    if (!this.isStreaming()) {
      this.interviewPrepService.resetStream();
      this.viewingHistoryItem.set(null);
    }
  }

  toggleQuestion(index: number) {
    const current = new Set(this.expandedQuestions());
    if (current.has(index)) {
      current.delete(index);
    } else {
      current.add(index);
    }
    this.expandedQuestions.set(current);
  }

  isExpanded(index: number): boolean {
    return this.expandedQuestions().has(index);
  }

  expandAll() {
    const all = new Set<number>();
    for (let i = 0; i < this.questions().length; i++) {
      all.add(i);
    }
    this.expandedQuestions.set(all);
  }

  collapseAll() {
    this.expandedQuestions.set(new Set());
  }

  viewHistoryItem(item: InterviewPrepHistoryItem) {
    this.viewingHistoryItem.set(item);
    this.interviewPrepService.viewHistoryItem(item);
    this.expandAll();
  }

  onDeleteHistoryItem(event: Event, item: InterviewPrepHistoryItem) {
    event.stopPropagation(); // Prevent viewing when clicking delete
    
    if (confirm('Are you sure you want to delete this generation?')) {
      this.interviewPrepService.deleteResult(item.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Generation removed from history',
          });
          this.interviewPrepService.loadHistory();
          if (this.viewingHistoryItem()?.id === item.id) {
            this.onReset();
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete result',
          });
        }
      });
    }
  }

  getTypeLabel(type: string): string {
    return type === 'TOPIC_WISE' ? 'Topic Wise' : 'Scenario Based';
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  }

  copyToClipboard() {
    const content = JSON.stringify(this.questions(), null, 2);
    navigator.clipboard.writeText(content).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Questions copied as JSON',
        life: 2000,
      });
    });
  }
}
