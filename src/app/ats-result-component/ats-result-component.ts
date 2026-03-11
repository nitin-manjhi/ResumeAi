import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  signal,
  effect
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { MessageService } from "primeng/api";
import { ResumeAnalysisService } from "../service/resume-analysis-service";
import { ButtonModule } from "primeng/button";
import { KnobModule } from "primeng/knob";
import { TagModule } from "primeng/tag";
import { TabsModule } from "primeng/tabs";
import { TextareaModule } from "primeng/textarea";
import { AccordionModule } from "primeng/accordion";
import { PanelModule } from "primeng/panel";
import { FormsModule } from "@angular/forms";
import { AtsAnalysisResult } from "../shared/modal/ats-analysis-result";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

@Component({
  selector: "app-ats-result-component",
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    KnobModule,
    TagModule,
    AccordionModule,
    PanelModule,
    FormsModule,
    TabsModule,
    TextareaModule,
  ],
  templateUrl: "./ats-result-component.html",
  styleUrl: "./ats-result-component.scss",
  providers: [MessageService],
})
export class AtsResultComponent implements OnInit {
  @Input() result!: AtsAnalysisResult;
  @Output() onReset = new EventEmitter<void>();

  private readonly resumeService = inject(ResumeAnalysisService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  activeMainTab = 0;
  activeTab = 0;
  editableResume = "";

  isGeneratingCL = this.resumeService.isGeneratingCL;
  isGeneratingEmail = this.resumeService.isGeneratingEmail;
  isMobile = signal(window.innerWidth < 768);

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
    });
    effect(() => {
      const res = this.resumeService.currentResult();
      if (res?.coverLetter && this.isGeneratingCL()) {
        this.resumeService.setGeneratingCL(false);
        this.messageService.add({ severity: 'success', summary: 'Ready', detail: 'Cover letter is ready!' });
      }
      if (res?.email && this.isGeneratingEmail()) {
        this.resumeService.setGeneratingEmail(false);
        this.messageService.add({ severity: 'success', summary: 'Ready', detail: 'Email draft is ready!' });
      }
    });
  }

  ngOnInit() {
    if (this.result?.optimizedResume) {
      this.editableResume = this.result.optimizedResume;
    }
  }

  get formattedScoreExplanation(): string[] {
    const explanation = this.result?.scoreExplanation;
    if (!explanation) return [];

    if (Array.isArray(explanation)) {
      return explanation.map((line: string) => line.replace(/^[•\-\*]\s*/, "").trim());
    }

    // Fallback for string split
    return explanation
      .split(/\n|•/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
  }

  get scoreColor(): string {
    const score = this.result?.score || 0;
    if (score >= 80) return "var(--green-500)";
    if (score >= 50) return "var(--yellow-500)";
    return "var(--red-500)";
  }

  get scoreSeverity():
    | "success"
    | "warn"
    | "danger"
    | "secondary"
    | "info"
    | "contrast"
    | undefined {
    const score = this.result?.score || 0;
    if (score >= 80) return "success";
    if (score >= 50) return "warn";
    return "danger";
  }

  get scoreLabel(): string {
    const score = this.result?.score || 0;
    if (score >= 80) return "EXCELLENT";
    if (score >= 50) return "AVERAGE";
    return "POOR";
  }

  reset() {
    this.onReset.emit();
  }

  sendMail() {
    this.router.navigate(["/send-mail"], { state: { data: this.result } });
  }

  goToTracker() {
    this.router.navigate(["/job-tracker"]);
  }

  reviewCoverLetter() {
    if (this.result.coverLetter) {
      this.router.navigate(["/review-cover-letter"]);
    } else {
      this.generateCL();
    }
  }

  generateCL() {
    this.resumeService.setGeneratingCL(true);
    this.resumeService.generateCoverLetter(this.result.uuid!).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Processing', detail: 'Cover letter generation started...' });
      },
      error: () => {
        this.resumeService.setGeneratingCL(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start generation.' });
      }
    });
  }

  generateEmail() {
    this.resumeService.setGeneratingEmail(true);
    this.resumeService.generateEmail(this.result.uuid!).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Processing', detail: 'Email draft generation started...' });
      },
      error: () => {
        this.resumeService.setGeneratingEmail(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start generation.' });
      }
    });
  }

  getImportanceLabel(skill: string): string {
    return this.result.skillImportance?.[skill] || 'OPTIONAL';
  }

  getImportanceSeverity(skill: string): "info" | "secondary" | "success" | "warn" | "danger" | "contrast" | undefined {
    const importance = this.getImportanceLabel(skill);
    switch (importance) {
      case 'REQUIRED': return 'danger';
      case 'PREFERRED': return 'info';
      default: return 'secondary';
    }
  }

  copyResume() {
    const textToCopy = this.editableResume || this.result.optimizedResume;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      this.messageService.add({
        severity: "info",
        summary: "Copied",
        detail: "Resume copied to clipboard",
      });
    }
  }

  async exportToPDF() {
    try {
      this.messageService.add({
        severity: "info",
        summary: "Generating PDF",
        detail: "Creating ATS-readable document...",
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const sr = this.result.structuredResume;
      if (!sr) {
        this.messageService.add({
          severity: "warn",
          summary: "Note",
          detail: "Falling back to image mode (Less readable)",
        });
        return this.exportToPDFAsImage();
      }

      // --- HEADER ---
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(0, 0, 0);
      pdf.text(sr.fullName.toUpperCase(), pageWidth / 2, y, {
        align: "center",
      });

      y += 8;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(sr.title, pageWidth / 2, y, { align: "center" });

      y += 6;
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(sr.contact, pageWidth / 2, y, { align: "center" });

      y += 8;
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Helper for headers
      const addSectionHeader = (title: string) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(26, 86, 219); // Tech Blue
        pdf.text(title.toUpperCase(), margin, y);
        y += 2;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 7;
      };

      // Summary
      if (sr.summary) {
        addSectionHeader("Professional Summary");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        const lines = pdf.splitTextToSize(sr.summary, contentWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 5 + 8;
      }

      // Skills
      if (sr.skills?.length) {
        addSectionHeader("Technical Skills");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        const skillsText = sr.skills.join("  •  ");
        const skillLines = pdf.splitTextToSize(skillsText, contentWidth);
        pdf.text(skillLines, margin, y);
        y += skillLines.length * 5 + 8;
      }

      // Work Experience
      if (sr.workExperience?.length) {
        addSectionHeader("Professional Experience");
        sr.workExperience.forEach((exp: any) => {
          if (y > 250) {
            pdf.addPage();
            y = 20;
          }
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.text(exp.title + " | " + exp.company, margin, y);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.text(exp.date, pageWidth - margin, y, { align: "right" });
          y += 5;

          pdf.setFontSize(9.5);
          exp.points.forEach((point: any) => {
            const lines = pdf.splitTextToSize("•  " + point, contentWidth - 5);
            if (y + lines.length * 5 > 280) {
              pdf.addPage();
              y = 20;
            }
            pdf.text(lines, margin + 2, y);
            y += lines.length * 4.8;
          });
          y += 5;
        });
      }

      // Education
      if (sr.education?.length) {
        addSectionHeader("Education");
        sr.education.forEach((edu: any) => {
          if (y > 260) {
            pdf.addPage();
            y = 20;
          }
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.text(edu.title, margin, y);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.text(edu.date, pageWidth - margin, y, { align: "right" });
          y += 5;
          pdf.setFontSize(9.5);
          pdf.text(edu.college + " | " + edu.location, margin, y);
          y += 10;
        });
      }

      pdf.save(`Optimized_Resume_${sr.fullName.replace(/\\s+/g, "_")}.pdf`);
      this.messageService.add({
        severity: "success",
        summary: "Success",
        detail: "ATS-Readable PDF downloaded!",
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to generate text-based PDF.",
      });
    }
  }

  async exportToPDFAsImage() {
    const element = document.getElementById("resume-preview-content");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        pageWidth,
        contentHeight,
        undefined,
        "FAST",
      );
      pdf.save("resume_image.pdf");
    } catch (e) {
      console.error(e);
    }
  }
}
