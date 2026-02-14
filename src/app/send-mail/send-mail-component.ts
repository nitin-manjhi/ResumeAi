import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ResumeAnalysisService } from '../service/resume-analysis-service';

import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AtsAnalysisResult } from '../shared/modal/ats-analysis-result';

@Component({
  selector: 'app-send-mail-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    CheckboxModule,
    ButtonModule,
    TextareaModule,
    CardModule,
    FloatLabelModule,
    FileUploadModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './send-mail-component.html',
  styleUrl: './send-mail-component.scss',
})
export class SendMailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly resumeService = inject(ResumeAnalysisService);
  private readonly messageService = inject(MessageService);

  result: AtsAnalysisResult | null = null;
  subject: string = '';
  body: string = '';

  ngOnInit() {
    const stateData = history.state.data;
    if (stateData) {
      this.result = stateData as AtsAnalysisResult;
    } else {
      this.result = this.resumeService.currentResult() as AtsAnalysisResult;
    }

    if (this.result?.email) {
      this.subject = this.result.email.subject || '';
      this.body = this.result.email.body || '';
    }
  }

  copyToClipboard(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Text copied to clipboard'
      });
    });
  }

  cancel() {
    this.router.navigate(['/analyse-resume']);
  }
}
