import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { JobSearchService } from '../service/job-search.service';
import { LinkedInJobDTO, LinkedInJobSearchRequest } from '../shared/modal/linkedin-job';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Clipboard } from '@angular/cdk/clipboard';
import { JobApplicationService } from '../service/job-application.service';
import { ApplicationStatus, JobApplication } from '../shared/modal/job-application';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-job-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    InputNumberModule,
    CardModule,
    DialogModule,
    TooltipModule,
    TagModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    TextareaModule,
    DatePickerModule
  ],
  providers: [MessageService],
  templateUrl: './job-search.component.html',
  styleUrl: './job-search.component.scss'
})
export class JobSearchComponent implements OnInit {
  private fb = inject(FormBuilder);
  private jobSearchService = inject(JobSearchService);
  private jobApplicationService = inject(JobApplicationService);
  private messageService = inject(MessageService);
  private clipboard = inject(Clipboard);

  // Use signals from service for persistence
  jobs = this.jobSearchService.jobs;
  loading = this.jobSearchService.loading;
  progress = this.jobSearchService.progress;

  searchForm = this.fb.group({
    keyword: ['', Validators.required],
    location: ['', Validators.required],
    experienceLevel: [''],
    jobType: [''],
    datePosted: [''],
    remote: [false],
    limit: [10, [Validators.min(1), Validators.max(50)]]
  });

  displayDescription = signal(false);
  selectedJobDescription = signal('');

  displayAddTracker = signal(false);
  trackForm!: FormGroup;
  isSaving = signal(false);

  experienceLevels = [
    { label: 'Any', value: '' },
    { label: 'Entry Level', value: 'entry' },
    { label: 'Mid Level', value: 'mid' },
    { label: 'Senior Level', value: 'senior' }
  ];

  jobTypes = [
    { label: 'Any', value: '' },
    { label: 'Full-time', value: 'full-time' },
    { label: 'Contract', value: 'contract' }
  ];

  datePostedOptions = [
    { label: 'Any Time', value: '' },
    { label: 'Past 24 Hours', value: 'past_24h' },
    { label: 'Past Week', value: 'past_week' }
  ];

  ngOnInit() {
    // Restore last criteria if available
    const lastCriteria = this.jobSearchService.lastCriteria();
    if (lastCriteria) {
      this.searchForm.patchValue(lastCriteria);
    }

    this.initTrackForm();
  }

  private initTrackForm() {
    this.trackForm = this.fb.group({
      companyName: ['', Validators.required],
      jobTitle: ['', Validators.required],
      location: [''],
      jobDescription: ['', Validators.required],
      appliedDate: [new Date(), Validators.required],
      status: [ApplicationStatus.INITIALIZED]
    });
  }

  onSearch() {
    if (this.searchForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Keyword and Location are required.' });
      return;
    }

    this.jobSearchService.setJobs([]);
    const criteria = this.searchForm.value as LinkedInJobSearchRequest;

    this.jobSearchService.searchJobs(criteria).subscribe({
      next: (response) => {
        this.pollJobStatus(response.jobId);
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start search. ' + (error.error?.error || error.message) });
        this.jobSearchService.setLoading(false);
      }
    });
  }

  private pollJobStatus(jobId: string) {
    const pollInterval = setInterval(() => {
      this.jobSearchService.getJobStatus(jobId).subscribe({
        next: (response) => {
          if (response.progress) this.jobSearchService.setProgress(response.progress);
          
          if (response.status === 'DONE' || response.jobs) {
            clearInterval(pollInterval);
            const enrichedJobs = (response.jobs || []).map(job => ({
              ...job,
              postedDateSortValue: this.parsePostedDate(job.postedDate)
            }));
            this.jobSearchService.setJobs(enrichedJobs);
            this.jobSearchService.setLoading(false);
            
            if (!enrichedJobs || enrichedJobs.length === 0) {
              this.messageService.add({ severity: 'info', summary: 'No Results', detail: 'No jobs found for these criteria.' });
            } else {
               this.messageService.add({ severity: 'success', summary: 'Success', detail: `Found ${enrichedJobs.length} jobs.` });
            }
          } else if (response.status === 'FAILED') {
            clearInterval(pollInterval);
            this.jobSearchService.setLoading(false);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: response.errorMessage || 'Search failed.' });
          }
          // Continue polling if still PENDING or PROCESSING
        },
        error: (error) => {
          clearInterval(pollInterval);
          this.jobSearchService.setLoading(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Polling failed.' });
        }
      });
    }, 3000); // Poll every 3 seconds
  }

  showDescription(description: string) {
    this.selectedJobDescription.set(description);
    this.displayDescription.set(true);
  }

  copyToClipboard() {
    this.clipboard.copy(this.selectedJobDescription());
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Description copied to clipboard.' });
  }

  openAddTracker(job: LinkedInJobDTO) {
    this.trackForm.patchValue({
      companyName: job.company,
      jobTitle: job.title,
      location: job.location,
      jobDescription: job.description,
      appliedDate: new Date(),
      status: ApplicationStatus.INITIALIZED
    });
    this.displayAddTracker.set(true);
  }

  saveToTracker() {
    if (this.trackForm.invalid) return;

    this.isSaving.set(true);
    const formValue = this.trackForm.value;
    
    const application: JobApplication = {
      companyName: formValue.companyName,
      jobDescription: `Job Title: ${formValue.jobTitle}\n\n${formValue.jobDescription}`,
      status: formValue.status,
      appliedDate: formValue.appliedDate.toISOString(),
      location: formValue.location
    } as any; // Using location if backend supports it, else it will be ignored

    this.jobApplicationService.createApplication(application).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sent to Tracker', detail: 'Job successfully added to your application list.' });
        this.displayAddTracker.set(false);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add job to tracker.' });
        this.isSaving.set(false);
      }
    });
  }

  private parsePostedDate(dateStr: string): number {
    if (!dateStr) return 999999;
    const lowerStr = dateStr.toLowerCase();
    const match = lowerStr.match(/(\d+)/);
    if (!match) return 999999;

    const value = parseInt(match[1]);
    
    if (lowerStr.includes('minute')) return value;
    if (lowerStr.includes('hour')) return value * 60;
    if (lowerStr.includes('day')) return value * 1440;
    if (lowerStr.includes('week')) return value * 10080;
    if (lowerStr.includes('month')) return value * 43200;
    
    return 999999;
  }
}
