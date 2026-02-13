import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtsResultComponent } from './ats-result-component';

describe('AtsResultComponent', () => {
  let component: AtsResultComponent;
  let fixture: ComponentFixture<AtsResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtsResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtsResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
