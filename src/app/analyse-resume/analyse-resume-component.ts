import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ResumeAnalysisService } from '../service/resume-analysis-service';
import { FileUploadModule } from 'primeng/fileupload';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';

import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { firstValueFrom } from 'rxjs';
import { AtsResultComponent } from "../ats-result-component/ats-result-component";
import { AtsAnalysisResult } from '../shared/modal/ats-analysis-result';

@Component({
  selector: 'app-analyse-resume-component',
  imports: [ButtonModule, FileUploadModule, ToastModule, FormsModule, TextareaModule, FloatLabelModule, ProgressSpinnerModule, AtsResultComponent],
  providers: [MessageService],
  templateUrl: './analyse-resume-component.html',
  styleUrl: './analyse-resume-component.scss',
})
export class AnalyseResumeComponent {
  private readonly resumeService = inject(ResumeAnalysisService);
  private messageService = inject(MessageService);
  protected jobDescription = signal('');
  protected isLoading = signal(false);
  protected analysisResult = this.resumeService.currentResult;

  async onUpload(fileUpload: any) {
    if (fileUpload.files && fileUpload.files.length > 0) {
      const file = fileUpload.files[0];
      console.log(file);

      this.isLoading.set(true);
      try {
        const response = await firstValueFrom(
          this.resumeService.analyzeResume(file, this.jobDescription())
        );
        console.log(response);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Resume analysis completed successfully',
        });
        this.resumeService.setResult(response);
        fileUpload.clear();
      } catch (error) {
        console.error(error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to analyze resume',
        });
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

  onReset() {
    this.resumeService.clearResult();
    this.jobDescription.set('');
  }
}
