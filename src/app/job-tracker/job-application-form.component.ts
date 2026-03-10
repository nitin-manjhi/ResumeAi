import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JobApplicationService } from '../service/job-application.service';
import { JobApplication, ApplicationStatus, PaginatedResponse } from '../shared/modal/job-application';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'app-job-application-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        ButtonModule,
        ToastModule,
        DatePickerModule
    ],
    providers: [MessageService],
    templateUrl: './job-application-form.component.html'
})
export class JobApplicationFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly appService = inject(JobApplicationService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    applicationForm!: FormGroup;
    isEditMode = signal(false);
    applicationId: number | null = null;

    statusOptions = [
        { label: 'Initialized', value: ApplicationStatus.INITIALIZED },
        { label: 'Applied', value: ApplicationStatus.APPLIED },
        { label: 'Processing', value: ApplicationStatus.PROCESSING },
        { label: 'Rejected', value: ApplicationStatus.REJECTED },
        { label: 'Selected', value: ApplicationStatus.SELECTED }
    ];

    ngOnInit() {
        this.applicationId = this.route.snapshot.params['id'] ? +this.route.snapshot.params['id'] : null;
        this.isEditMode.set(!!this.applicationId);

        this.initForm();

        if (this.isEditMode()) {
            const app = this.appService.applications().find(a => a.id === this.applicationId);
            if (app) {
                this.patchForm(app);
            } else {
                this.appService.getAllApplications().subscribe((res: PaginatedResponse<JobApplication>) => {
                    const found = res.content.find((a: JobApplication) => a.id === this.applicationId);
                    if (found) this.patchForm(found);
                    else this.router.navigate(['/job-tracker']);
                });
            }
        }
    }

    private patchForm(app: JobApplication) {
        const patchData = { ...app };
        if (app.closingDate) patchData.closingDate = new Date(app.closingDate) as any;
        if (app.appliedDate) patchData.appliedDate = new Date(app.appliedDate) as any;
        this.applicationForm.patchValue(patchData);
    }

    private initForm() {
        this.applicationForm = this.fb.group({
            companyName: ['', [Validators.required]],
            jobDescription: ['', [Validators.maxLength(2000)]],
            status: [ApplicationStatus.INITIALIZED, [Validators.required]],
            hrName: [''],
            hrEmail: ['', [Validators.email]],
            phone: [''],
            resumePath: [''],
            closingDate: [null],
            appliedDate: [new Date(), [Validators.required]]
        });
    }

    onSubmit() {
        if (this.applicationForm.invalid) return;

        const appData = this.applicationForm.value;

        if (this.isEditMode()) {
            this.appService.updateApplication(this.applicationId!, appData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Application updated successfully' });
                    setTimeout(() => this.router.navigate(['/job-tracker']), 1000);
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update application' })
            });
        } else {
            this.appService.createApplication(appData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Created', detail: 'New application added' });
                    setTimeout(() => this.router.navigate(['/job-tracker']), 1000);
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add application' })
            });
        }
    }

    cancel() {
        this.router.navigate(['/job-tracker']);
    }
}
