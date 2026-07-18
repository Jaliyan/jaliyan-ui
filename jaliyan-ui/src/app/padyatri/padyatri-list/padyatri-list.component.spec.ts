import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PadyatriListComponent } from './padyatri-list.component';

describe('PadyatriListComponent', () => {
  let component: PadyatriListComponent;
  let fixture: ComponentFixture<PadyatriListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PadyatriListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PadyatriListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
