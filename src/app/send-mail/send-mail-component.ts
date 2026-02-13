import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
  private readonly location = inject(Location);
  private readonly resumeService = inject(ResumeAnalysisService);
  private readonly messageService = inject(MessageService);

  result: AtsAnalysisResult | null = null;

  recipientEmail: string = '';
  subject: string = '';
  body: string = '';
  attachResume: boolean = false;
  attachCoverLetter: boolean = false;
  selectedFiles: File[] = [];

  ngOnInit() {
    const stateData = history.state.data;
    if (stateData) {
      this.result = stateData as AtsAnalysisResult;
      if (this.result.email) {
        this.subject = this.result.email.subject || '';
        this.body = this.result.email.body || '';
      }
    }
  }

  onFileSelect(event: any) {
    if (event.files) {
      for (let file of event.files) {
        this.selectedFiles.push(file);
      }
    }
  }

  remove(file: File, uploader: any) {
    const index = this.selectedFiles.indexOf(file);
    if (index > -1) {
      this.selectedFiles.splice(index, 1);
    }
    const fileUploadIndex = uploader.files.indexOf(file);
    if (fileUploadIndex > -1) {
      uploader.remove(null, fileUploadIndex);
    }
  }

  // Not strictly needed if using p-fileupload in basic or advanced mode which manages its own list usually, 
  // but if we want manual control we'd keep this. 
  // However, p-fileupload with [customUpload]="true" passes files in the event.
  // We will assume "advanced" mode or basic with multiple. Let's stick to the event handling.

  send() {
    const formData = new FormData();
    formData.append('to', this.recipientEmail);
    formData.append('subject', this.subject);
    formData.append('body', this.body);
    formData.append('attachGeneratedResume', String(this.attachResume));
    formData.append('attachGeneratedCoverLetter', String(this.attachCoverLetter));

    if (this.result?.uuid) {
      formData.append('analysisUuid', this.result.uuid); // Changed to analysisUuid to match likely backend param
    }

    this.selectedFiles.forEach((file) => {
      formData.append('attachments', file);
    });

    this.messageService.add({ severity: 'info', summary: 'Sending...', detail: 'Please wait while we send your email' });

    this.resumeService.sendEmail(formData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Email sent successfully' });
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send email' });
      }
    });
  }

  cancel() {
    this.location.back();
  }
}
