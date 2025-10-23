import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintAllIdCardsDialogComponent } from './print-all-id-cards-dialog.component';

describe('PrintAllIdCardsDialogComponent', () => {
  let component: PrintAllIdCardsDialogComponent;
  let fixture: ComponentFixture<PrintAllIdCardsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrintAllIdCardsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintAllIdCardsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
