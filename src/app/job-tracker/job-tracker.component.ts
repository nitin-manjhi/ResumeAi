import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobApplicationService } from '../service/job-application.service';
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
        InputIconModule
    ],
    providers: [DialogService, MessageService],
    templateUrl: './job-tracker.component.html'
})
export class JobTrackerComponent implements OnInit {
    private readonly appService = inject(JobApplicationService);
    private readonly dialogService = inject(DialogService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    applications = this.appService.applications;
    activeTab = signal(0);
    ref: DynamicDialogRef | undefined | null;
    today = new Date();

    statusOptions = [
        { label: 'All Statuses', value: null },
        { label: 'Initialized', value: ApplicationStatus.INITIALIZED },
        { label: 'Applied', value: ApplicationStatus.APPLIED },
        { label: 'Processing', value: ApplicationStatus.PROCESSING },
        { label: 'Rejected', value: ApplicationStatus.REJECTED },
        { label: 'Selected', value: ApplicationStatus.SELECTED }
    ];

    ngOnInit() {
        this.appService.getAllApplications().subscribe();
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
                next: () => this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Application removed successfully' }),
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

    addNew() {
        this.router.navigate(['/job-tracker/add']);
    }
}
