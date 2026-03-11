import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ResumeAnalysisService } from '../service/resume-analysis-service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { jsPDF } from 'jspdf';

@Component({
    selector: 'app-review-cover-letter',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CardModule, TextareaModule, ToastModule],
    providers: [MessageService],
    templateUrl: './review-cover-letter-component.html',
    styleUrl: './review-cover-letter-component.scss'
})
export class ReviewCoverLetterComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly resumeService = inject(ResumeAnalysisService);
    private readonly messageService = inject(MessageService);

    coverLetter = signal<string>('');
    fullName = signal<string>('Professional');
    isMobile = signal<boolean>(window.innerWidth < 768);

    constructor() {
        window.addEventListener('resize', () => {
            this.isMobile.set(window.innerWidth < 768);
        });
    }

    ngOnInit() {
        const result = this.resumeService.currentResult();
        if (result) {
            this.coverLetter.set(result.coverLetter || '');
            // AtsAnalysisResult doesn't have fullName, using default or extracting if needed
            this.fullName.set('Candidate');
        } else {
            this.router.navigate(['/analyse-resume']);
        }
    }

    goBack() {
        this.router.navigate(['/analyse-resume']);
    }

    generatePDF() {
        try {
            const doc = new jsPDF();
            const margin = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const textWidth = pageWidth - (margin * 2);

            doc.setFontSize(12);
            const splitText = doc.splitTextToSize(this.coverLetter(), textWidth);
            doc.text(splitText, margin, 30);

            doc.save(`Cover_Letter_${this.fullName().replace(/\s+/g, '_')}.pdf`);
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Cover letter PDF generated!' });
        } catch (error) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate PDF' });
        }
    }
}
