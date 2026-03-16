import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ResumeStateService {
  private readonly _resumeFormData = signal<any>(null);
  readonly resumeFormData = this._resumeFormData.asReadonly();

  private readonly _activeStep = signal<number>(0);
  readonly activeStep = this._activeStep.asReadonly();

  private readonly _density = signal<'compact' | 'normal' | 'spacious'>('normal');
  readonly density = this._density.asReadonly();

  private readonly _sectionOrder = signal<any[] | null>(null);
  readonly sectionOrder = this._sectionOrder.asReadonly();

  saveFormData(data: any) {
    this._resumeFormData.set(data);
  }

  saveActiveStep(step: number) {
    this._activeStep.set(step);
  }

  saveDensity(density: 'compact' | 'normal' | 'spacious') {
    this._density.set(density);
  }

  saveSectionOrder(order: any[]) {
    this._sectionOrder.set(order);
  }

  clearState() {
    this._resumeFormData.set(null);
    this._activeStep.set(0);
    this._density.set('normal');
    this._sectionOrder.set(null);
  }
}
