import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
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
    DialogModule,
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
    {
      id: 'education',
      label: 'Education',
      icon: 'pi pi-graduation-cap',
      color: 'bg-blue-500',
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: 'pi pi-wrench',
      color: 'bg-green-500',
    },
    {
      id: 'workExperience',
      label: 'Work Experiences',
      icon: 'pi pi-briefcase',
      color: 'bg-indigo-500',
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: 'pi pi-folder',
      color: 'bg-purple-500',
    },
    {
      id: 'other',
      label: 'Activities & Leadership',
      icon: 'pi pi-star',
      color: 'bg-teal-500',
    },
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
      {
        label: 'General Information',
        command: (event: any) => this.goToStep(0),
      },
      { label: 'Education', command: (event: any) => this.goToStep(1) },
      { label: 'Skills', command: (event: any) => this.goToStep(2) },
      { label: 'Work Experience', command: (event: any) => this.goToStep(3) },
      { label: 'Projects', command: (event: any) => this.goToStep(4) },
      { label: 'Other', command: (event: any) => this.goToStep(5) },
      { label: 'Layout', command: (event: any) => this.goToStep(6) },
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
        summary: [''],
      }),
      education: this.fb.array([]),
      skills: this.fb.group({
        layout: ['categorized'], // 'categorized' or 'bullets'
        categories: this.fb.array([]),
        bulletSkills: [[]], // Array for p-chips
      }),
      workExperience: this.fb.array([]),
      projects: this.fb.array([]),
      other: this.fb.array([]),
    });

    // Initialize with one item for each to encourage user (optional, but good UX)
    this.addEducation();
    this.addSkillCategory();
    this.addWorkExperience();
    this.addProject();
    this.addOther();

    // Fetch States
    this.locationService.getStates().subscribe({
      next: (data: string[]) => (this.states = data),
      error: (err: any) => console.error('Error fetching states', err),
    });

    // Fetch Degrees
    this.educationService.getDegrees().subscribe({
      next: (data: string[]) => (this.degrees = data),
      error: (err: any) => console.error('Error fetching degrees', err),
    });
  }

  get missingSkills() {
    const allAddedSkills = new Set<string>();

    // Collect skills from bullets
    const bullets = this.skillGroup.get('bulletSkills')?.value || [];
    if (Array.isArray(bullets)) {
      bullets.forEach((s) => allAddedSkills.add(s.toLowerCase().trim()));
    }

    // Collect skills from categories
    this.skillCategories.controls.forEach((control) => {
      const skills = control.get('skills')?.value || [];
      if (Array.isArray(skills)) {
        skills.forEach((s) => allAddedSkills.add(s.toLowerCase().trim()));
      }
    });

    return (this.resumeService.currentResult()?.missingSkills || []).filter(
      (skill) => !allAddedSkills.has(skill.toLowerCase().trim()),
    );
  }

  get addedSuggestionsCount(): number {
    const allAddedSkills = new Set<string>();

    // Collect skills from bullets
    const bullets = this.skillGroup?.get('bulletSkills')?.value || [];
    if (Array.isArray(bullets)) {
      bullets.forEach((s) => allAddedSkills.add(s.toLowerCase().trim()));
    }

    // Collect skills from categories
    this.skillCategories?.controls?.forEach((control) => {
      const skills = control.get('skills')?.value || [];
      if (Array.isArray(skills)) {
        skills.forEach((s) => allAddedSkills.add(s.toLowerCase().trim()));
      }
    });

    return allAddedSkills.size;
  }

  get generalInfo() {
    return this.resumeForm.get('generalInfo') as FormGroup;
  }

  get education() {
    return this.resumeForm.get('education') as FormArray;
  }
  get skillGroup() {
    return this.resumeForm.get('skills') as FormGroup;
  }
  get skillCategories() {
    return this.skillGroup.get('categories') as FormArray;
  }
  get workExperience() {
    return this.resumeForm.get('workExperience') as FormArray;
  }
  get projects() {
    return this.resumeForm.get('projects') as FormArray;
  }
  get other() {
    return this.resumeForm.get('other') as FormArray;
  }

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
    if (index === 0) {
      // General Info is always accessible
      this.activeStep = index;
      return;
    }

    // Check if all MANDATORY steps BEFORE the target step are valid
    for (let i = 0; i < index; i++) {
      if (i <= 3 && !this.isStepValid(i)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Missing Information',
          detail: `Please complete the mandatory step: ${this.steps[i].label} before moving forward.`,
        });
        this.activeStep = i;
        return;
      }
    }
    this.activeStep = index;
  }

  isAllMandatoryStepsValid(): boolean {
    for (let i = 0; i <= 3; i++) {
      if (!this.isStepValid(i)) return false;
    }
    return true;
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
      grade: [''],
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
    group.patchValue(
      {
        city: '',
        institute: '',
        location: '',
      },
      { emitEvent: false },
    );

    if (state) {
      // Fetch Cities
      this.locationService.getCities(state).subscribe({
        next: (cities: string[]) => {
          this.educationCities[index] = [...cities, 'Other'];
        },
        error: (err: any) => console.error('Error fetching cities', err),
      });

      // Fetch Colleges
      this.educationService.getCollegesByState(state).subscribe({
        next: (colleges: string[]) => {
          // Use backend data directly as 'Other' is already included
          this.educationColleges[index] = colleges;
        },
        error: (err: any) => console.error('Error fetching colleges', err),
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
      this.education
        .at(index)
        .get('otherInstitute')
        ?.setValidators([Validators.required]);
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
      skills: [[], Validators.required], // Array for p-chips
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
      message:
        'Switching layouts will clear your current entries to refresh suggestions.',
      header: 'Warning: Data Loss',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: 'none',
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
        this.messageService.add({
          severity: 'info',
          summary: 'Layout Switched',
          detail: 'Skills have been reset.',
        });
      },
    });
  }

  generateCategorizedSkills() {
    const missing = this.missingSkills;
    if (missing.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No suggestions',
        detail: 'No missing skills to categorize.',
      });
      return;
    }

    this.isCategorizing = true;
    this.resumeService.categorizeSkills(missing).subscribe({
      next: (response: any) => {
        const data =
          typeof response === 'string' ? JSON.parse(response) : response;
        if (data.categories) {
          // Clear existing categories if they only have placeholder data
          if (
            this.skillCategories.length === 1 &&
            !this.skillCategories.at(0).get('category')?.value &&
            this.skillCategories.at(0).get('skills')?.value.length === 0
          ) {
            this.skillCategories.clear();
          }

          data.categories.forEach((cat: any) => {
            // Check limit before adding
            if (this.addedSuggestionsCount < this.MAX_SUGGESTIONS) {
              const skillsToAdd = cat.skills.slice(
                0,
                this.MAX_SUGGESTIONS - this.addedSuggestionsCount,
              );
              if (skillsToAdd.length > 0) {
                const group = this.createSkillCategoryGroup();
                group.patchValue({
                  category: cat.category,
                  skills: skillsToAdd,
                });
                this.skillCategories.push(group);
              }
            }
          });
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Skills categorized successfully!',
          });
        }
        this.isCategorizing = false;
        this.showCategorizationDialog = false;
      },
      error: (err) => {
        console.error('Categorization error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to categorize skills.',
        });
        this.isCategorizing = false;
      },
    });
  }

  getBulletSkillsArray(): string[] {
    return this.skillGroup.get('bulletSkills')?.value || [];
  }

  addSkillToBullets(skill: string) {
    if (this.addedSuggestionsCount >= this.MAX_SUGGESTIONS) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit Reached',
        detail: `You can only add up to ${this.MAX_SUGGESTIONS} suggestions.`,
      });
      return;
    }

    const currentSkills = this.skillGroup.get('bulletSkills')?.value || [];
    if (!currentSkills.includes(skill)) {
      this.skillGroup.get('bulletSkills')?.setValue([...currentSkills, skill]);
      this.messageService.add({
        severity: 'success',
        summary: 'Skill Added',
        detail: `${skill} added to your skills.`,
      });
    }
  }

  addSkillToCategory(skill: string, categoryIndex: number) {
    if (this.addedSuggestionsCount >= this.MAX_SUGGESTIONS) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit Reached',
        detail: `You can only add up to ${this.MAX_SUGGESTIONS} suggestions.`,
      });
      return;
    }

    const category = this.skillCategories.at(categoryIndex);
    const currentSkills = category.get('skills')?.value || [];
    if (!currentSkills.includes(skill)) {
      category.get('skills')?.setValue([...currentSkills, skill]);
      this.messageService.add({
        severity: 'success',
        summary: 'Skill Added',
        detail: `${skill} added to ${category.get('category')?.value || 'category'}.`,
      });
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
          detail: `You have reached the AI suggestion limit of ${this.MAX_SUGGESTIONS} skills.`,
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
      description: [''],
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

    group.patchValue(
      {
        city: '',
        location: '',
      },
      { emitEvent: false },
    );

    if (state) {
      this.locationService.getCities(state).subscribe({
        next: (cities: string[]) => {
          this.workCities[index] = [...cities, 'Other'];
        },
        error: (err: any) => console.error('Error fetching cities', err),
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
      description: [''],
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
      description: [''],
    });
  }

  addOther() {
    this.other.push(this.createOtherGroup());
  }

  removeOther(index: number) {
    this.other.removeAt(index);
  }

  async downloadPDF() {
    try {
      this.messageService.add({
        severity: 'info',
        summary: 'Generating PDF',
        detail: 'Creating ATS-readable document...',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Density-based configuration
      const densityConfig = {
        compact: { title: 20, section: 10, item: 9, line: 4, spacing: 3 },
        normal: { title: 22, section: 11, item: 10, line: 4.5, spacing: 4.5 },
        spacious: { title: 24, section: 12, item: 11, line: 5.5, spacing: 6 }
      }[this.density] || { title: 22, section: 11, item: 10, line: 4.5, spacing: 4.5 };

      let y = margin;

      // Helper to check page overflow
      const checkPage = (heightNeeded: number) => {
        if (y + heightNeeded > pageHeight - margin) {
          pdf.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // 1. HEADER
      const gInfo = this.generalInfo.value;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(densityConfig.title);
      pdf.text(gInfo.fullName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
      y += densityConfig.spacing;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(80);

      const contactParts = [
        gInfo.email,
        gInfo.mobileNumber,
        gInfo.linkedinUrl ? 'LinkedIn' : null,
        gInfo.githubUrl ? 'GitHub' : null,
        gInfo.portfolioUrl ? 'Portfolio' : null
      ].filter(p => !!p);

      const contactText = contactParts.join('  |  ');
      pdf.text(contactText, pageWidth / 2, y, { align: 'center' });

      // Add links for social profiles
      const textWidth = pdf.getTextWidth(contactText);
      let currentX = (pageWidth - textWidth) / 2;

      contactParts.forEach((part: any, i: number) => {
        const partWidth = pdf.getTextWidth(part);
        if (part === 'LinkedIn' && gInfo.linkedinUrl) {
          pdf.link(currentX, y - 3, partWidth, 5, { url: gInfo.linkedinUrl });
        } else if (part === 'GitHub' && gInfo.githubUrl) {
          pdf.link(currentX, y - 3, partWidth, 5, { url: gInfo.githubUrl });
        } else if (part === 'Portfolio' && gInfo.portfolioUrl) {
          pdf.link(currentX, y - 3, partWidth, 5, { url: gInfo.portfolioUrl });
        }
        currentX += partWidth + pdf.getTextWidth('  |  ');
      });

      y += densityConfig.spacing;

      // Summary (if enabled)
      if (gInfo.addSummary && gInfo.summary) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(densityConfig.item);
        pdf.setTextColor(0);
        const summaryLines = pdf.splitTextToSize(gInfo.summary, contentWidth);
        pdf.text(summaryLines, margin, y);
        y += (summaryLines.length * densityConfig.line) + densityConfig.spacing;
      }

      // SECTIONS (Respecting Order)
      this.sectionOrder.forEach((section: any) => {
        switch (section.id) {
          case 'education':
            if (this.education.length > 0) {
              this.addSectionTitle(pdf, 'Education', margin, y, contentWidth, densityConfig);
              y += densityConfig.spacing;
              this.education.value.forEach((edu: any) => {
                if (!edu.institute) return;
                checkPage(15);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(densityConfig.item);
                const instName = edu.institute === 'Other' ? (edu.otherInstitute || 'Institute') : edu.institute;
                pdf.text(instName, margin, y);
                pdf.text(edu.location || '', pageWidth - margin, y, { align: 'right' });
                y += densityConfig.line;

                pdf.setFont('helvetica', 'italic');
                const degreeText = `${edu.degree}${edu.fieldOfStudy ? ' in ' + edu.fieldOfStudy : ''}`;
                pdf.text(degreeText, margin, y);
                const dateText = `${this.formatDate(edu.startDate)} - ${edu.current ? 'Present' : this.formatDate(edu.endDate)}`;
                pdf.text(dateText, pageWidth - margin, y, { align: 'right' });
                y += densityConfig.line;

                if (edu.grade) {
                  pdf.setFont('helvetica', 'normal');
                  pdf.setFontSize(densityConfig.item - 1);
                  pdf.text(`${edu.gradeType}: ${edu.grade}`, margin, y);
                  y += densityConfig.line;
                }
                y += densityConfig.spacing / 2;
              });
            }
            break;

          case 'skills':
            if (this.addedSuggestionsCount > 0) {
              this.addSectionTitle(pdf, 'Skills', margin, y, contentWidth, densityConfig);
              y += densityConfig.spacing;
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(densityConfig.item);

              if (this.skillGroup.value.layout === 'categorized') {
                this.skillCategories.value.forEach((cat: any) => {
                  if (cat.skills?.length > 0) {
                    checkPage(densityConfig.line);
                    const catTitle = cat.category ? `${cat.category}: ` : '';
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(catTitle, margin, y);
                    const titleWidth = pdf.getTextWidth(catTitle);
                    pdf.setFont('helvetica', 'normal');
                    const skillsText = cat.skills.join(', ');
                    const lines = pdf.splitTextToSize(skillsText, contentWidth - titleWidth);
                    pdf.text(lines, margin + titleWidth, y);
                    y += (lines.length * densityConfig.line) + 1;
                  }
                });
              } else {
                const skills = this.getBulletSkillsArray().join('  •  ');
                const lines = pdf.splitTextToSize(skills, contentWidth);
                pdf.text(lines, margin, y);
                y += (lines.length * densityConfig.line);
              }
              y += densityConfig.spacing;
            }
            break;

          case 'workExperience':
            if (this.workExperience.length > 0) {
              this.addSectionTitle(pdf, 'Professional Experience', margin, y, contentWidth, densityConfig);
              y += densityConfig.spacing;
              this.workExperience.value.forEach((work: any) => {
                if (!work.jobTitle) return;
                checkPage(15);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(densityConfig.item);
                pdf.text(work.jobTitle, margin, y);
                const dateText = `${this.formatDate(work.startDate)} - ${work.current ? 'Present' : this.formatDate(work.endDate)}`;
                pdf.text(dateText, pageWidth - margin, y, { align: 'right' });
                y += densityConfig.line;

                pdf.setFont('helvetica', 'bolditalic');
                pdf.text(work.company, margin, y);
                pdf.setFont('helvetica', 'italic');
                pdf.text(work.location || '', pageWidth - margin, y, { align: 'right' });
                y += densityConfig.line;

                if (work.description) {
                  pdf.setFont('helvetica', 'normal');
                  work.description.split('\n').forEach((point: string) => {
                    if (!point.trim()) return;
                    const lines = pdf.splitTextToSize('• ' + point.trim(), contentWidth - 5);
                    checkPage(lines.length * densityConfig.line);
                    pdf.text(lines, margin + 2, y);
                    y += (lines.length * densityConfig.line);
                  });
                }
                y += densityConfig.spacing / 2;
              });
            }
            break;

          case 'projects':
            if (this.projects.length > 0) {
              this.addSectionTitle(pdf, 'Projects', margin, y, contentWidth, densityConfig);
              y += densityConfig.spacing;
              this.projects.value.forEach((proj: any) => {
                if (!proj.title) return;
                checkPage(10);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(densityConfig.item);
                pdf.text(proj.title, margin, y);
                if (proj.technologies) {
                  pdf.setFont('helvetica', 'italic');
                  pdf.setFontSize(densityConfig.item - 1);
                  pdf.text(proj.technologies, pageWidth - margin, y, { align: 'right' });
                }
                y += densityConfig.line;

                if (proj.description) {
                  pdf.setFont('helvetica', 'normal');
                  pdf.setFontSize(densityConfig.item);
                  proj.description.split('\n').forEach((point: string) => {
                    if (!point.trim()) return;
                    const lines = pdf.splitTextToSize('• ' + point.trim(), contentWidth - 5);
                    checkPage(lines.length * densityConfig.line);
                    pdf.text(lines, margin + 2, y);
                    y += (lines.length * densityConfig.line);
                  });
                }
                y += densityConfig.spacing / 2;
              });
            }
            break;

          case 'other':
            if (this.other.length > 0) {
              this.addSectionTitle(pdf, 'Certifications & Activities', margin, y, contentWidth, densityConfig);
              y += densityConfig.spacing;
              this.other.value.forEach((item: any) => {
                if (!item.title) return;
                checkPage(10);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(densityConfig.item);
                pdf.text(item.title, margin, y);
                y += densityConfig.line;
                if (item.description) {
                  pdf.setFont('helvetica', 'italic');
                  const lines = pdf.splitTextToSize(item.description, contentWidth);
                  pdf.text(lines, margin, y);
                  y += (lines.length * densityConfig.line);
                }
                y += densityConfig.spacing / 2;
              });
            }
            break;
        }
      });

      const fileName = `${this.generalInfo.get('fullName')?.value || 'Resume'}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      // Track usage
      this.resumeService.trackGeneration().subscribe({
        next: () => this.authService.getUserProfile().subscribe(),
        error: (err) => console.error('Failed to track', err)
      });

      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'ATS-Readable Resume Downloaded!' });
    } catch (error) {
      console.error('PDF Error:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate text-based PDF.' });
    }
  }

  private addSectionTitle(pdf: any, title: string, x: number, y: number, width: number, config: any) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(config.section);
    pdf.setTextColor(0, 0, 0);
    pdf.text(title.toUpperCase(), x, y);
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.4);
    pdf.line(x, y + 1.5, x + width, y + 1.5);
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
          detail: `Please complete all required fields for ${this.steps[this.activeStep].label}.`,
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
