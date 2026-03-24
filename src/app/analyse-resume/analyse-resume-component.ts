import { Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ResumeAnalysisService } from '../service/resume-analysis-service';
import { CardModule } from 'primeng/card';
import { FileUploadModule } from 'primeng/fileupload';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { firstValueFrom } from 'rxjs';
import { AtsResultComponent } from '../ats-result-component/ats-result-component';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../service/notification.service';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { AdminService } from '../service/admin.service';

@Component({
  selector: 'app-analyse-resume-component',
  imports: [
    ButtonModule,
    FileUploadModule,
    ToastModule,
    FormsModule,
    SelectButtonModule,
    ProgressBarModule,
    TextareaModule,
    FloatLabelModule,
    CardModule,
    ProgressSpinnerModule,
    InputTextModule,
    BadgeModule,
    AtsResultComponent,
  ],
  templateUrl: './analyse-resume-component.html',
  styleUrl: './analyse-resume-component.scss',
})
export class AnalyseResumeComponent {
  private readonly resumeService = inject(ResumeAnalysisService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly adminService = inject(AdminService);
  private messageService = inject(MessageService);
  protected jobDescription = signal('');
  protected companyName = signal('');
  protected applicationId = signal<number | undefined>(undefined);
  protected isMobile = signal(window.innerWidth < 768);
  protected isLoading = signal(false);
  protected isRequesting = signal(false);

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
    });

    // Auto-hydration logic
    const preFilled = this.resumeService.preFilledData();
    if (preFilled) {
      this.companyName.set(preFilled.companyName);
      this.jobDescription.set(preFilled.jdText);
      this.applicationId.set(preFilled.applicationId);
      // Clear after hydration
      this.resumeService.setPreFilledData(null);
    }
  }
  protected jobSubmitted = computed(() => this.resumeService.isAnalyzing() || !!this.readyResultId());
  protected readyResultId = this.notificationService.latestResultId;
  protected analysisResult = this.resumeService.currentResult;

  protected progress = this.notificationService.currentProgress;
  protected progressMessage = this.notificationService.currentProgressMessage;

  protected isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');
  protected isPremium = computed(() => this.isAdmin() || this.authService.currentUser()?.premiumActive || false);
  protected isPremiumQuotaReached = computed(() => {
    if (this.isAdmin()) return false;
    const profile = this.authService.currentUser();
    if (!profile) return true;
    return profile.premiumUsageCount >= profile.premiumUsageLimit;
  });
  protected isStandardQuotaReached = computed(() => {
    if (this.isAdmin()) return false;
    const profile = this.authService.currentUser();
    if (!profile) return true;
    return profile.analysisCount >= profile.usageLimit;
  });

  protected isSuspended = computed(() => this.authService.currentUser()?.suspended || false);

  protected selectedModel = signal('ollama');
  protected modelOptions = computed(() => [
    {
      label: 'Standard Intelligence',
      value: 'ollama',
      icon: 'pi pi-server',
      disabled: this.isStandardQuotaReached() || this.isSuspended()
    },
    {
      label: 'Advanced AI (Pro)',
      value: 'openai',
      icon: 'pi pi-bolt',
      disabled: !this.isPremium() || this.isPremiumQuotaReached() || this.isSuspended()
    },
    {
      label: 'Elite AI (Deep)',
      value: 'gemini',
      icon: 'pi pi-sparkles',
      disabled: !this.isPremium() || this.isPremiumQuotaReached() || this.isSuspended()
    }
  ]);

  async onUpload(fileUpload: any) {
    if (this.isSuspended()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Access Revoked',
        detail: 'your resume anaysis functionality suspend, please message admin to enable again',
        life: 10000
      });
      return;
    }

    if (fileUpload.files && fileUpload.files.length > 0) {
      const file = fileUpload.files[0];
      console.log(file);

      this.isLoading.set(true);
      try {
        const response = await firstValueFrom(
          this.resumeService.analyzeResume(file, this.jobDescription(), this.selectedModel(), this.companyName(), this.applicationId()),
        );
        console.log(response);
        this.messageService.add({
          severity: 'success',
          summary: 'Submitted',
          detail: 'Resume submitted for analysis. You will be notified via WebSocket once processing is complete.',
        });

        this.resumeService.setAnalyzing(true, response.uuid);
        this.jobDescription.set('');

        // Refresh profile to update usage counts
        this.authService.getUserProfile().subscribe();

        fileUpload.clear();
      } catch (error: any) {
        console.error(error);
        const errorMessage = error.error?.message || error.message || '';
        if (errorMessage.includes('limit reached')) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Limit Reached',
            detail:
              'You have reached your analysis limit. Please upgrade your plan in the profile section to get more credits.',
            life: 5000,
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to analyze resume',
          });
        }
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a file to upload',
      });
    }
  }

  requestUnsuspension() {
    this.isRequesting.set(true);
    this.adminService.requestUnsuspension().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Request Sent',
          detail: 'Your message has been sent to the admin. You will be notified once they review it.',
          life: 10000
        });
        this.isRequesting.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send request. Please try again later.'
        });
        this.isRequesting.set(false);
      }
    });
  }

  onReset() {
    this.resumeService.clearResult();
    this.jobDescription.set('');
    this.companyName.set('');
    this.applicationId.set(undefined);
    this.notificationService.clearLatestResultId();
  }

  viewResult() {
    const id = this.readyResultId();
    if (id) {
      this.notificationService.viewResult(id);
    }
  }
}
