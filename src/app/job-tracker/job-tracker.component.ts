import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobApplicationService } from '../service/job-application.service';
import { ResumeAnalysisService } from '../service/resume-analysis-service';
import { JobApplication, ApplicationStatus } from '../shared/modal/job-application';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { JdModalComponent } from './jd-modal.component';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-job-tracker',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        TabsModule,
        TagModule,
        DynamicDialogModule,
        ToastModule,
        TooltipModule,
        InputTextModule,
        SelectModule,
        FormsModule,
        IconFieldModule,
        InputIconModule,
        DialogModule,
        TextareaModule
    ],
    providers: [DialogService, MessageService],
    templateUrl: './job-tracker.component.html'
})
export class JobTrackerComponent implements OnInit {
    private readonly appService = inject(JobApplicationService);
    private readonly dialogService = inject(DialogService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly resumeService = inject(ResumeAnalysisService);

    applications = signal<JobApplication[]>([]);
    totalRecords = signal(0);
    loading = signal(false);
    activeTab = signal(0);
    lastLazyLoadEvent: any;
    ref: DynamicDialogRef | undefined | null;
    today = new Date();
    
    // Review Popup signals
    displayReviewPopup = signal(false);
    reviewJd = signal('');
    reviewCompanyName = signal('');
    charLimit = 2000;

    statusOptions = [
        { label: 'All Statuses', value: null },
        { label: 'Initialized', value: ApplicationStatus.INITIALIZED },
        { label: 'Applied', value: ApplicationStatus.APPLIED },
        { label: 'Processing', value: ApplicationStatus.PROCESSING },
        { label: 'Rejected', value: ApplicationStatus.REJECTED },
        { label: 'Selected', value: ApplicationStatus.SELECTED }
    ];

    ngOnInit() {
        // Handled by lazy load
    }

    loadApplications(event: any) {
        this.lastLazyLoadEvent = event;
        this.loading.set(true);
        const page = event.first / event.rows;
        const size = event.rows;
        const sortField = event.sortField;
        const sortOrder = event.sortOrder;
        const search = event.globalFilter;
        const status = event.filters?.status?.value;

        this.appService.getPaginatedApplications(page, size, sortField, sortOrder, search, status).subscribe({
            next: (res) => {
                this.applications.set(res.content);
                this.totalRecords.set(res.totalElements);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    reload() {
        if (this.lastLazyLoadEvent) {
            this.loadApplications(this.lastLazyLoadEvent);
        }
    }

    viewJd(jd: string, company: string) {
        this.ref = this.dialogService.open(JdModalComponent, {
            header: `Job Description - ${company}`,
            width: '50%',
            contentStyle: { overflow: 'auto' },
            breakpoints: {
                '960px': '75vw',
                '640px': '90vw'
            },
            data: {
                content: jd
            }
        });
    }

    getStatusSeverity(status: ApplicationStatus): "info" | "success" | "warn" | "danger" | "secondary" | "contrast" | undefined {
        switch (status) {
            case ApplicationStatus.INITIALIZED: return 'secondary';
            case ApplicationStatus.APPLIED: return 'info';
            case ApplicationStatus.PROCESSING: return 'warn';
            case ApplicationStatus.SELECTED: return 'success';
            case ApplicationStatus.REJECTED: return 'danger';
            default: return 'secondary';
        }
    }

    editApplication(app: JobApplication) {
        this.router.navigate(['/job-tracker/edit', app.id]);
    }

    deleteApplication(app: JobApplication) {
        if (confirm(`Are you sure you want to delete the application for ${app.companyName}?`)) {
            this.appService.deleteApplication(app.id!).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Application removed successfully' });
                    this.reload();
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete application' })
            });
        }
    }

    isExpired(closingDate: string | undefined): boolean {
        if (!closingDate) return false;
        const closing = new Date(closingDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return closing < today;
    }

    viewAnalysis(app: JobApplication) {
        // Clear old result first to prevent "caching" old job data in the UI
        this.resumeService.clearResult();
        this.loading.set(true);

        // Always check backend for the latest analysis state for this job
        this.appService.getAnalysisResult(app.id!).subscribe({
            next: (result) => {
                this.loading.set(false);
                if (result && result.uuid) {
                    // Result found in DB - set it to signal and navigate
                    this.resumeService.setResult(result);
                    this.router.navigate(['/analyse-resume']);
                } else {
                    // No result found - proceed to start new analysis
                    this.startAnalysis(app);
                }
            },
            error: (err) => {
                this.loading.set(false);
                console.error('Error checking analysis', err);
                // Fallback to normal behavior on error
                this.startAnalysis(app);
            }
        });
    }

    private startAnalysis(app: JobApplication) {
        const jd = app.jobDescription || '';
        if (jd.length <= this.charLimit) {
            // Under limit - capture and redirect
            this.resumeService.setPreFilledData({
                companyName: app.companyName,
                jdText: jd,
                applicationId: app.id
            });
            this.router.navigate(['/analyse-resume']);
        } else {
            // Over limit - launch review popup
            this.reviewJd.set(jd);
            this.reviewCompanyName.set(app.companyName);
            this.displayReviewPopup.set(true);
            (this.displayReviewPopup as any).applicationId = app.id;
        }
    }

    proceedToAnalysis() {
        this.resumeService.setPreFilledData({
            companyName: this.reviewCompanyName(),
            jdText: this.reviewJd(),
            applicationId: (this.displayReviewPopup as any).applicationId
        });
        this.displayReviewPopup.set(false);
        this.router.navigate(['/analyse-resume']);
    }

    addNew() {
        this.router.navigate(['/job-tracker/add']);
    }

    exportData() {
        this.appService.exportApplications().subscribe({
            next: (data) => {
                const headers = ['Company Name', 'Status', 'HR Name', 'HR Email', 'Phone', 'Applied Date', 'Closing Date', 'Resume Path', 'Job Description'];
                const rows = data.map(app => [
                    this.escapeCSV(app.companyName),
                    this.escapeCSV(app.status),
                    this.escapeCSV(app.hrName || ''),
                    this.escapeCSV(app.hrEmail || ''),
                    this.escapeCSV(app.phone || ''),
                    app.appliedDate || '',
                    app.closingDate || '',
                    this.escapeCSV(app.resumePath || ''),
                    this.escapeCSV((app.jobDescription || '').replace(/\n/g, '[[NL]]'))
                ]);

                const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `job-tracker-backup-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'CSV Backup file created' });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to export data' })
        });
    }

    private escapeCSV(value: string): string {
        if (!value) return '""';
        // Remove existing newlines to ensure spreadsheet compatibility regardless of our NL placeholder
        const cleanValue = value.replace(/\r?\n|\r/g, ' ');
        return `"${cleanValue.replace(/"/g, '""')}"`;
    }

    onImport(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                try {
                    const csvContent = e.target.result;
                    const lines = csvContent.split('\n').filter((l: string) => l.trim() !== '');
                    if (lines.length < 2) throw new Error('Empty file');

                    const apps: JobApplication[] = lines.slice(1).map((line: string) => {
                        const values = this.parseCSVLine(line);
                        return {
                            companyName: values[0],
                            status: values[1] as any,
                            hrName: values[2],
                            hrEmail: values[3],
                            phone: values[4],
                            appliedDate: values[5] ? values[5] : undefined,
                            closingDate: values[6] ? values[6] : undefined,
                            resumePath: values[7],
                            jobDescription: (values[8] || '').replace(/\[\[NL\]\]/g, '\n')
                        };
                    });

                    this.appService.importApplications(apps).subscribe({
                        next: () => {
                            this.messageService.add({ severity: 'success', summary: 'Imported', detail: 'Applications restored successfully' });
                            this.reload();
                            event.target.value = '';
                        },
                        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to import data' })
                    });
                } catch (err) {
                    console.error('Import error:', err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid CSV backup file' });
                }
            };
            reader.readAsText(file);
        }
    }

    private parseCSVLine(line: string): string[] {
        const result = [];
        let curValue = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    curValue += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(curValue);
                curValue = '';
            } else {
                curValue += char;
            }
        }
        result.push(curValue);
        return result;
    }
}
