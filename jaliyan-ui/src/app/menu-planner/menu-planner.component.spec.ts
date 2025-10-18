import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuPlannerComponent } from './menu-planner.component';

describe('MenuPlannerComponent', () => {
  let component: MenuPlannerComponent;
  let fixture: ComponentFixture<MenuPlannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MenuPlannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
