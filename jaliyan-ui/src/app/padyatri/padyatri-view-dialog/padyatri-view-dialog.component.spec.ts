import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PadyatriViewDialogComponent } from './padyatri-view-dialog.component';

describe('PadyatriViewDialogComponent', () => {
  let component: PadyatriViewDialogComponent;
  let fixture: ComponentFixture<PadyatriViewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PadyatriViewDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PadyatriViewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
