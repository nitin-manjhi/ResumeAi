import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { DatePickerModule } from 'primeng/datepicker';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LocationService } from '../service/location.service';
import { EducationService } from '../service/education.service';
import { ResumeAnalysisService } from '../service/resume-analysis-service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-generate-resume-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    StepsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TextareaModule,
    ToastModule,
    DatePickerModule,
    DragDropModule,
    SelectModule,
    RadioButtonModule,
    ChipModule,
    ConfirmDialogModule,
    DialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './generate-resume-component.html',
  styleUrl: './generate-resume-component.scss',
})
export class GenerateResumeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private locationService = inject(LocationService);
  private educationService = inject(EducationService);
  private resumeService = inject(ResumeAnalysisService);
  private authService = inject(AuthService);

  steps: MenuItem[] = [];
  activeStep: number = 0;
  resumeForm!: FormGroup;
  showPreview: boolean = true;
  showCategorizationDialog: boolean = false;
  isCategorizing: boolean = false;

  states: string[] = [];
  degrees: string[] = [];
  educationCities: { [key: number]: string[] } = {};
  educationColleges: { [key: number]: string[] } = {};
  workCities: { [key: number]: string[] } = {};
  private lastEducationState: { [key: number]: string } = {};
  private lastWorkState: { [key: number]: string } = {};

  readonly MAX_SUGGESTIONS = 20;

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
      { label: 'General Information', command: (event: any) => this.goToStep(0) },
      { label: 'Education', command: (event: any) => this.goToStep(1) },
      { label: 'Skills', command: (event: any) => this.goToStep(2) },
      { label: 'Work Experience', command: (event: any) => this.goToStep(3) },
      { label: 'Projects', command: (event: any) => this.goToStep(4) },
      { label: 'Other', command: (event: any) => this.goToStep(5) },
      { label: 'Layout', command: (event: any) => this.goToStep(6) }
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
      skills: this.fb.group({
        layout: ['categorized'], // 'categorized' or 'bullets'
        categories: this.fb.array([]),
        bulletSkills: [[]] // Array for p-chips
      }),
      workExperience: this.fb.array([]),
      projects: this.fb.array([]),
      other: this.fb.array([])
    });

    // Initialize with one item for each to encourage user (optional, but good UX)
    this.addEducation();
    this.addSkillCategory();
    this.addWorkExperience();
    this.addProject();
    this.addOther();

    // Fetch States
    this.locationService.getStates().subscribe({
      next: (data: string[]) => this.states = data,
      error: (err: any) => console.error('Error fetching states', err)
    });

    // Fetch Degrees
    this.educationService.getDegrees().subscribe({
      next: (data: string[]) => this.degrees = data,
      error: (err: any) => console.error('Error fetching degrees', err)
    });
  }

  get missingSkills() {
    const allAddedSkills = new Set<string>();

    // Collect skills from bullets
    const bullets = this.skillGroup.get('bulletSkills')?.value || [];
    if (Array.isArray(bullets)) {
      bullets.forEach(s => allAddedSkills.add(s.toLowerCase().trim()));
    }

    // Collect skills from categories
    this.skillCategories.controls.forEach(control => {
      const skills = control.get('skills')?.value || [];
      if (Array.isArray(skills)) {
        skills.forEach(s => allAddedSkills.add(s.toLowerCase().trim()));
      }
    });

    return (this.resumeService.currentResult()?.missingSkills || [])
      .filter(skill => !allAddedSkills.has(skill.toLowerCase().trim()));
  }

  get addedSuggestionsCount(): number {
    const allAddedSkills = new Set<string>();

    // Collect skills from bullets
    const bullets = this.skillGroup?.get('bulletSkills')?.value || [];
    if (Array.isArray(bullets)) {
      bullets.forEach(s => allAddedSkills.add(s.toLowerCase().trim()));
    }

    // Collect skills from categories
    this.skillCategories?.controls?.forEach(control => {
      const skills = control.get('skills')?.value || [];
      if (Array.isArray(skills)) {
        skills.forEach(s => allAddedSkills.add(s.toLowerCase().trim()));
      }
    });

    return allAddedSkills.size;
  }

  get generalInfo() {
    return this.resumeForm.get('generalInfo') as FormGroup;
  }

  get education() { return this.resumeForm.get('education') as FormArray; }
  get skillGroup() { return this.resumeForm.get('skills') as FormGroup; }
  get skillCategories() { return this.skillGroup.get('categories') as FormArray; }
  get workExperience() { return this.resumeForm.get('workExperience') as FormArray; }
  get projects() { return this.resumeForm.get('projects') as FormArray; }
  get other() { return this.resumeForm.get('other') as FormArray; }

  isStepValid(index: number): boolean {
    switch (index) {
      case 0: // General Info
        return this.generalInfo.valid;
      case 1: // Education
        return this.education.length > 0 && this.education.valid;
      case 2: // Skills
        return this.addedSuggestionsCount > 0;
      case 3: // Work Experience
        return this.workExperience.length > 0 && this.workExperience.valid;
      default:
        return true;
    }
  }

  goToStep(index: number) {
    if (index === 0 || index === 6) { // General Info and Layout are always accessible
      this.activeStep = index;
      return;
    }

    // Check if all MANDATORY steps BEFORE the target step are valid
    for (let i = 0; i < index; i++) {
      if (i <= 3 && !this.isStepValid(i)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Missing Information',
          detail: `Please complete the mandatory step: ${this.steps[i].label} before moving forward.`
        });
        this.activeStep = i;
        return;
      }
    }
    this.activeStep = index;
  }

  // Education Helpers
  createEducationGroup(): FormGroup {
    return this.fb.group({
      institute: ['', Validators.required],
      otherInstitute: [''],
      state: [''],
      city: [''],
      otherCity: [''],
      location: [''],
      degree: ['', Validators.required],
      fieldOfStudy: [''],
      startDate: [''],
      endDate: [''],
      current: [false],
      gradeType: ['CGPA'],
      grade: ['']
    });
  }

  addEducation() {
    this.education.push(this.createEducationGroup());
  }

  removeEducation(index: number) {
    this.education.removeAt(index);
    delete this.educationCities[index];
    delete this.educationColleges[index];
    delete this.lastEducationState[index];
  }

  onEducationStateChange(index: number) {
    const group = this.education.at(index);
    const state = group.get('state')?.value;

    if (this.lastEducationState[index] === state) return;
    this.lastEducationState[index] = state;

    // Reset dependent fields
    group.patchValue({
      city: '',
      institute: '',
      location: ''
    }, { emitEvent: false });

    if (state) {
      // Fetch Cities
      this.locationService.getCities(state).subscribe({
        next: (cities: string[]) => {
          this.educationCities[index] = [...cities, 'Other'];
        },
        error: (err: any) => console.error('Error fetching cities', err)
      });

      // Fetch Colleges
      this.educationService.getCollegesByState(state).subscribe({
        next: (colleges: string[]) => {
          // Use backend data directly as 'Other' is already included
          this.educationColleges[index] = colleges;
        },
        error: (err: any) => console.error('Error fetching colleges', err)
      });
    } else {
      this.educationCities[index] = [];
      this.educationColleges[index] = [];
    }
  }

  onEducationCityChange(index: number) {
    const group = this.education.at(index);
    const city = group.get('city')?.value;
    const state = group.get('state')?.value;

    if (city !== 'Other') {
      group.patchValue({ otherCity: '' }, { emitEvent: false });
      group.get('otherCity')?.clearValidators();
      if (city && state) {
        group.get('location')?.setValue(`${city}, ${state}`);
      }
    } else {
      group.get('otherCity')?.setValidators([Validators.required]);
      group.get('location')?.setValue(state ? `, ${state}` : '');
    }
    group.get('otherCity')?.updateValueAndValidity();
  }

  onEducationOtherCityChange(index: number) {
    const group = this.education.at(index);
    const otherCity = group.get('otherCity')?.value;
    const state = group.get('state')?.value;
    if (otherCity && state) {
      group.get('location')?.setValue(`${otherCity}, ${state}`);
    }
  }

  onEducationInstituteChange(index: number) {
    const institute = this.education.at(index).get('institute')?.value;
    if (institute !== 'Other') {
      this.education.at(index).get('otherInstitute')?.setValue('');
      this.education.at(index).get('otherInstitute')?.clearValidators();
    } else {
      this.education.at(index).get('otherInstitute')?.setValidators([Validators.required]);
    }
    this.education.at(index).get('otherInstitute')?.updateValueAndValidity();
  }

  onGradeTypeChange(index: number) {
    this.education.at(index).get('grade')?.setValue('');
  }

  // Skills Helpers
  createSkillCategoryGroup(): FormGroup {
    return this.fb.group({
      category: [''], // e.g. Languages, Frameworks
      skills: [[], Validators.required] // Array for p-chips
    });
  }

  addSkillCategory() {
    this.skillCategories.push(this.createSkillCategoryGroup());
  }

  removeSkillCategory(index: number) {
    this.skillCategories.removeAt(index);
  }

  onLayoutChange(newLayout: string) {
    const currentLayout = this.skillGroup.get('layout')?.value;
    if (currentLayout === newLayout) return;

    if (this.addedSuggestionsCount === 0) {
      this.skillGroup.get('layout')?.setValue(newLayout);
      return;
    }

    this.confirmationService.confirm({
      message: 'Switching layouts will clear your current entries to refresh suggestions.',
      header: 'Warning: Data Loss',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: "none",
      rejectVisible: false, // User requested no 'No' option
      acceptLabel: 'OK',
      accept: () => {
        // Clear data from the layout we are LEAVING
        if (currentLayout === 'categorized') {
          this.skillCategories.clear();
          this.addSkillCategory();
        } else {
          this.skillGroup.get('bulletSkills')?.setValue([]);
        }

        // Switch to the new layout
        this.skillGroup.get('layout')?.setValue(newLayout);
        this.messageService.add({ severity: 'info', summary: 'Layout Switched', detail: 'Skills have been reset.' });
      }
    });
  }

  generateCategorizedSkills() {
    const missing = this.missingSkills;
    if (missing.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'No suggestions', detail: 'No missing skills to categorize.' });
      return;
    }

    this.isCategorizing = true;
    this.resumeService.categorizeSkills(missing).subscribe({
      next: (response: any) => {
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        if (data.categories) {
          // Clear existing categories if they only have placeholder data
          if (this.skillCategories.length === 1 && (!this.skillCategories.at(0).get('category')?.value && this.skillCategories.at(0).get('skills')?.value.length === 0)) {
            this.skillCategories.clear();
          }

          data.categories.forEach((cat: any) => {
            // Check limit before adding
            if (this.addedSuggestionsCount < this.MAX_SUGGESTIONS) {
              const skillsToAdd = cat.skills.slice(0, this.MAX_SUGGESTIONS - this.addedSuggestionsCount);
              if (skillsToAdd.length > 0) {
                const group = this.createSkillCategoryGroup();
                group.patchValue({
                  category: cat.category,
                  skills: skillsToAdd
                });
                this.skillCategories.push(group);
              }
            }
          });
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Skills categorized successfully!' });
        }
        this.isCategorizing = false;
        this.showCategorizationDialog = false;
      },
      error: (err) => {
        console.error('Categorization error:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to categorize skills.' });
        this.isCategorizing = false;
      }
    });
  }

  getBulletSkillsArray(): string[] {
    return this.skillGroup.get('bulletSkills')?.value || [];
  }

  addSkillToBullets(skill: string) {
    if (this.addedSuggestionsCount >= this.MAX_SUGGESTIONS) {
      this.messageService.add({ severity: 'warn', summary: 'Limit Reached', detail: `You can only add up to ${this.MAX_SUGGESTIONS} suggestions.` });
      return;
    }

    const currentSkills = this.skillGroup.get('bulletSkills')?.value || [];
    if (!currentSkills.includes(skill)) {
      this.skillGroup.get('bulletSkills')?.setValue([...currentSkills, skill]);
      this.messageService.add({ severity: 'success', summary: 'Skill Added', detail: `${skill} added to your skills.` });
    }
  }

  addSkillToCategory(skill: string, categoryIndex: number) {
    if (this.addedSuggestionsCount >= this.MAX_SUGGESTIONS) {
      this.messageService.add({ severity: 'warn', summary: 'Limit Reached', detail: `You can only add up to ${this.MAX_SUGGESTIONS} suggestions.` });
      return;
    }

    const category = this.skillCategories.at(categoryIndex);
    const currentSkills = category.get('skills')?.value || [];
    if (!currentSkills.includes(skill)) {
      category.get('skills')?.setValue([...currentSkills, skill]);
      this.messageService.add({ severity: 'success', summary: 'Skill Added', detail: `${skill} added to ${category.get('category')?.value || 'category'}.` });
    }
  }

  // Manual Chip Management
  onSkillInput(event: any, control: any) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();

      if (this.addedSuggestionsCount >= this.MAX_SUGGESTIONS) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Limit Reached',
          detail: `You have reached the AI suggestion limit of ${this.MAX_SUGGESTIONS} skills.`
        });
        return;
      }

      const value = event.target.value.trim().replace(/,$/, '');
      if (value) {
        const currentSkills = control.value || [];
        if (!currentSkills.includes(value)) {
          control.setValue([...currentSkills, value]);
        }
        event.target.value = '';
      }
    }
  }

  removeSkillFromControl(skill: string, control: any) {
    const currentSkills = control.value || [];
    control.setValue(currentSkills.filter((s: string) => s !== skill));
  }

  // Work Experience Helpers
  createWorkGroup(): FormGroup {
    return this.fb.group({
      jobTitle: ['', Validators.required],
      company: ['', Validators.required],
      state: [''],
      city: [''],
      otherCity: [''],
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
    delete this.workCities[index];
    delete this.lastWorkState[index];
  }

  onWorkStateChange(index: number) {
    const group = this.workExperience.at(index);
    const state = group.get('state')?.value;

    if (this.lastWorkState[index] === state) return;
    this.lastWorkState[index] = state;

    group.patchValue({
      city: '',
      location: ''
    }, { emitEvent: false });

    if (state) {
      this.locationService.getCities(state).subscribe({
        next: (cities: string[]) => {
          this.workCities[index] = [...cities, 'Other'];
        },
        error: (err: any) => console.error('Error fetching cities', err)
      });
    } else {
      this.workCities[index] = [];
    }
  }

  onWorkCityChange(index: number) {
    const group = this.workExperience.at(index);
    const city = group.get('city')?.value;
    const state = group.get('state')?.value;

    if (city !== 'Other') {
      group.patchValue({ otherCity: '' }, { emitEvent: false });
      group.get('otherCity')?.clearValidators();
      if (city && state) {
        group.get('location')?.setValue(`${city}, ${state}`);
      }
    } else {
      group.get('otherCity')?.setValidators([Validators.required]);
      group.get('location')?.setValue(state ? `, ${state}` : '');
    }
    group.get('otherCity')?.updateValueAndValidity();
  }

  onWorkOtherCityChange(index: number) {
    const group = this.workExperience.at(index);
    const otherCity = group.get('otherCity')?.value;
    const state = group.get('state')?.value;
    if (otherCity && state) {
      group.get('location')?.setValue(`${otherCity}, ${state}`);
    }
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
    const originalElement = document.getElementById('resumePreview');
    if (!originalElement) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not find resume preview.' });
      return;
    }

    this.messageService.add({ severity: 'info', summary: 'Generating PDF', detail: 'Optimizing for high quality...' });

    // Create a clone to avoid capturing browser scaling/transforms
    const clone = originalElement.cloneNode(true) as HTMLElement;

    // Style the clone for perfect capture
    Object.assign(clone.style, {
      position: 'absolute',
      left: '-9999px',
      top: '0',
      transform: 'none',
      width: '210mm',
      height: 'auto',
      margin: '0',
      padding: '15mm 20mm',
      boxSizing: 'border-box'
    });

    document.body.appendChild(clone);

    // Wait for a few frames to ensure layout is stable
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Use higher scale and fix letter rendering issues
      const canvas = await html2canvas(clone, {
        scale: 3, // Increased scale for better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // Standard A4 width in pixels at 96 DPI
        onclone: (document) => {
          // Additional fixes during capture
          const elements = document.getElementsByClassName('resume-preview-container');
          if (elements.length > 0) {
            (elements[0] as HTMLElement).style.transform = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const fileName = `${this.generalInfo.get('fullName')?.value || 'Resume'}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      // Track usage and refresh profile
      this.resumeService.trackGeneration().subscribe({
        next: () => this.authService.getUserProfile().subscribe(),
        error: (err) => {
          console.error('Failed to track generation', err);
          const errorMessage = err.error?.message || err.message || '';
          if (errorMessage.includes('limit reached')) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Limit Reached',
              detail: 'You have reached your generation limit. This PDF was downloaded, but future generations will be restricted until you upgrade.',
              life: 5000
            });
          }
        }
      });

      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'PDF downloaded successfully!' });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate PDF.' });
    } finally {
      // Cleanup the clone
      document.body.removeChild(clone);
    }
  }

  next() {
    if (this.activeStep < this.steps.length - 1) {
      if (this.activeStep <= 3 && !this.isStepValid(this.activeStep)) {
        if (this.activeStep === 0) this.generalInfo.markAllAsTouched();
        if (this.activeStep === 1) this.education.markAllAsTouched();
        if (this.activeStep === 3) this.workExperience.markAllAsTouched();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Please complete all required fields for ${this.steps[this.activeStep].label}.`
        });
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
