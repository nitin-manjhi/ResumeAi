import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyseResumeComponent } from './analyse-resume-component';

describe('AnalyseResumeComponent', () => {
  let component: AnalyseResumeComponent;
  let fixture: ComponentFixture<AnalyseResumeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyseResumeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyseResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
