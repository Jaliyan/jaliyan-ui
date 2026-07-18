import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicInfoDashboardComponent } from './public-info-dashboard.component';

describe('PublicInfoDashboardComponent', () => {
  let component: PublicInfoDashboardComponent;
  let fixture: ComponentFixture<PublicInfoDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PublicInfoDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicInfoDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
