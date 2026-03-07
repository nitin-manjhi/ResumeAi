import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ResumeAnalysisService } from '../service/resume-analysis-service';
import { ButtonModule } from 'primeng/button';
import { KnobModule } from 'primeng/knob';
import { TagModule } from 'primeng/tag';
import { AccordionModule } from 'primeng/accordion';
import { PanelModule } from 'primeng/panel';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { AtsAnalysisResult } from '../shared/modal/ats-analysis-result';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-ats-result-component',
  standalone: true,
  imports: [CommonModule, ButtonModule, KnobModule, TagModule, AccordionModule, PanelModule, FormsModule, TabsModule, TextareaModule],
  templateUrl: './ats-result-component.html',
  styleUrl: './ats-result-component.scss',
  providers: [MessageService]
})
export class AtsResultComponent implements OnInit {
  @Input() result!: AtsAnalysisResult;
  @Output() onReset = new EventEmitter<void>();

  private readonly resumeService = inject(ResumeAnalysisService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  activeMainTab = 0;
  activeTab = 0;
  editableResume = '';

  ngOnInit() {
    if (this.result?.newResume) {
      this.editableResume = this.result.newResume;
    }
  }

  get formattedScoreExplanation(): string[] {
    if (!this.result?.scoreExplanation) return [];
    // Split by newlines or bullet symbols and filter out empty strings
    return this.result.scoreExplanation
      .split(/\n|•/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  get scoreColor(): string {
    const score = this.result?.score || 0;
    if (score >= 80) return 'var(--green-500)';
    if (score >= 50) return 'var(--yellow-500)';
    return 'var(--red-500)';
  }

  get scoreSeverity(): "success" | "warn" | "danger" | "secondary" | "info" | "contrast" | undefined {
    const score = this.result?.score || 0;
    if (score >= 80) return 'success';
    if (score >= 50) return 'warn';
    return 'danger';
  }

  get scoreLabel(): string {
    const score = this.result?.score || 0;
    if (score >= 80) return 'EXCELLENT';
    if (score >= 50) return 'AVERAGE';
    return 'POOR';
  }

  reset() {
    this.onReset.emit();
  }

  sendMail() {
    this.router.navigate(['/send-mail'], { state: { data: this.result } });
  }

  reviewCoverLetter() {
    this.router.navigate(['/review-cover-letter']);
  }

  copyResume() {
    const textToCopy = this.editableResume || this.result.newResume;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      this.messageService.add({ severity: 'info', summary: 'Copied', detail: 'Resume copied to clipboard' });
    }
  }

  async exportToPDF() {
    const element = document.getElementById('resume-preview-content');
    if (!element) return;

    try {
      this.messageService.add({ severity: 'info', summary: 'Generating PDF', detail: 'Please wait...' });
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Optimized_Resume_${this.result.uuid.substring(0, 8)}.pdf`);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'PDF downloaded successfully' });
    } catch (error) {
      console.error('PDF generation failed', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate PDF' });
    }
  }

}
