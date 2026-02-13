import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { DatePickerModule } from 'primeng/datepicker';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-generate-resume-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StepsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TextareaModule,
    ToastModule,
    DatePickerModule,
    DragDropModule
  ],
  providers: [MessageService],
  templateUrl: './generate-resume-component.html',
  styleUrl: './generate-resume-component.scss',
})
export class GenerateResumeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  steps: MenuItem[] = [];
  activeStep: number = 0;
  resumeForm!: FormGroup;
  showPreview: boolean = true;

  // Layout Settings
  sectionOrder = [
    { id: 'education', label: 'Education', icon: 'pi pi-graduation-cap', color: 'bg-blue-500' },
    { id: 'skills', label: 'Skills', icon: 'pi pi-wrench', color: 'bg-green-500' },
    { id: 'workExperience', label: 'Work Experiences', icon: 'pi pi-briefcase', color: 'bg-indigo-500' },
    { id: 'projects', label: 'Projects', icon: 'pi pi-folder', color: 'bg-purple-500' },
    { id: 'other', label: 'Activities & Leadership', icon: 'pi pi-star', color: 'bg-teal-500' }
  ];
  density: 'compact' | 'normal' | 'spacious' = 'normal';

  onDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.sectionOrder, event.previousIndex, event.currentIndex);
  }

  setDensity(value: 'compact' | 'normal' | 'spacious') {
    this.density = value;
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  ngOnInit() {
    this.steps = [
      { label: 'General Information', command: (event: any) => this.activeStep = 0 },
      { label: 'Education', command: (event: any) => this.activeStep = 1 },
      { label: 'Skills', command: (event: any) => this.activeStep = 2 },
      { label: 'Work Experience', command: (event: any) => this.activeStep = 3 },
      { label: 'Projects', command: (event: any) => this.activeStep = 4 },
      { label: 'Other', command: (event: any) => this.activeStep = 5 },
      { label: 'Layout', command: (event: any) => this.activeStep = 6 }
    ];

    this.resumeForm = this.fb.group({
      generalInfo: this.fb.group({
        fullName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        mobileNumber: ['', Validators.required],
        linkedinUrl: ['', Validators.required],
        githubUrl: [''],
        portfolioUrl: [''],
        addSummary: [false],
        summary: ['']
      }),
      education: this.fb.array([]),
      skills: this.fb.array([]),
      workExperience: this.fb.array([]),
      projects: this.fb.array([]),
      other: this.fb.array([])
    });

    // Initialize with one item for each to encourage user (optional, but good UX)
    this.addEducation();
    this.addSkill();
    this.addWorkExperience();
    this.addProject();
    this.addOther();
  }

  get generalInfo() {
    return this.resumeForm.get('generalInfo') as FormGroup;
  }

  get education() { return this.resumeForm.get('education') as FormArray; }
  get skills() { return this.resumeForm.get('skills') as FormArray; }
  get workExperience() { return this.resumeForm.get('workExperience') as FormArray; }
  get projects() { return this.resumeForm.get('projects') as FormArray; }
  get other() { return this.resumeForm.get('other') as FormArray; }

  // Education Helpers
  createEducationGroup(): FormGroup {
    return this.fb.group({
      institute: ['', Validators.required],
      location: [''],
      degree: ['', Validators.required],
      fieldOfStudy: [''],
      startDate: [''],
      endDate: [''],
      current: [false],
      grade: ['']
    });
  }

  addEducation() {
    this.education.push(this.createEducationGroup());
  }

  removeEducation(index: number) {
    this.education.removeAt(index);
  }

  // Skills Helpers
  createSkillGroup(): FormGroup {
    return this.fb.group({
      category: [''], // e.g. Languages, Frameworks
      skills: ['', Validators.required] // Comma separated
    });
  }

  addSkill() {
    this.skills.push(this.createSkillGroup());
  }

  removeSkill(index: number) {
    this.skills.removeAt(index);
  }

  // Work Experience Helpers
  createWorkGroup(): FormGroup {
    return this.fb.group({
      jobTitle: ['', Validators.required],
      company: ['', Validators.required],
      location: [''],
      startDate: [''],
      endDate: [''],
      current: [false],
      description: ['']
    });
  }

  addWorkExperience() {
    this.workExperience.push(this.createWorkGroup());
  }

  removeWorkExperience(index: number) {
    this.workExperience.removeAt(index);
  }

  // Project Helpers
  createProjectGroup(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      technologies: [''],
      link: [''],
      description: ['']
    });
  }

  addProject() {
    this.projects.push(this.createProjectGroup());
  }

  removeProject(index: number) {
    this.projects.removeAt(index);
  }

  // Other Helpers
  createOtherGroup(): FormGroup {
    return this.fb.group({
      title: [''],
      description: ['']
    });
  }

  addOther() {
    this.other.push(this.createOtherGroup());
  }

  removeOther(index: number) {
    this.other.removeAt(index);
  }



  async downloadPDF() {
    const data = document.getElementById('resumePreview');
    if (!data) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not find resume preview.' });
      return;
    }

    this.messageService.add({ severity: 'info', summary: 'Generating PDF', detail: 'Please wait...' });

    try {
      const canvas = await html2canvas(data, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const contentDataURL = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.addImage(contentDataURL, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');

      const fileName = `${this.generalInfo.get('fullName')?.value || 'Resume'}.pdf`;
      pdf.save(fileName);

      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'PDF downloaded successfully!' });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate PDF.' });
    }
  }

  next() {
    if (this.activeStep < this.steps.length - 1) {
      if (this.activeStep === 0 && this.generalInfo.invalid) {
        this.generalInfo.markAllAsTouched();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill in all required fields.' });
        return;
      }
      this.activeStep++;
    }
  }

  isLastStep(): boolean {
    return this.activeStep === this.steps.length - 1;
  }

  prev() {
    if (this.activeStep > 0) {
      this.activeStep--;
    }
  }
}
