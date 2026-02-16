import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ResumeAnalysisService } from '../service/resume-analysis-service';
import { ButtonModule } from 'primeng/button';
import { KnobModule } from 'primeng/knob';
import { TagModule } from 'primeng/tag';
import { AccordionModule } from 'primeng/accordion';
import { PanelModule } from 'primeng/panel';
import { FormsModule } from '@angular/forms';
import { AtsAnalysisResult } from '../shared/modal/ats-analysis-result';

@Component({
  selector: 'app-ats-result-component',
  imports: [CommonModule, ButtonModule, KnobModule, TagModule, AccordionModule, PanelModule, FormsModule],
  templateUrl: './ats-result-component.html',
  styleUrl: './ats-result-component.scss',
})
export class AtsResultComponent {
  @Input() result!: AtsAnalysisResult;
  @Output() onReset = new EventEmitter<void>();

  private readonly resumeService = inject(ResumeAnalysisService);
  private readonly router = inject(Router);

  reset() {
    this.onReset.emit();
  }

  sendMail() {
    this.router.navigate(['/send-mail'], { state: { data: this.result } });
  }

  reviewCoverLetter() {
    this.router.navigate(['/review-cover-letter']);
  }

}
