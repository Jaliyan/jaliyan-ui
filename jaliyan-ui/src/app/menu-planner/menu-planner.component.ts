import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MenuplannerService } from '../services/menuplanner.service';
import { FooditemsService } from '../services/fooditems.service';
import { FoodItem, MealType, MenuDate } from '../common/fooditem.model';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-menu-planner',
  templateUrl: './menu-planner.component.html',
  styleUrls: ['./menu-planner.component.css'],
  standalone: false
})
export class MenuPlannerComponent implements OnInit {
  menuForm!: FormGroup;

  menuDates: MenuDate[] = [];
  mealTypes: MealType[] = [];
  menuItems: FoodItem[] = [];
  filteredMenuItems: FoodItem[] = [];

  itemFilterCtrl: FormControl = new FormControl('');
  plannedMenus: any[] = [];
  userName: any;

  constructor(
    private fb: FormBuilder,
    private menuService: MenuplannerService,
    private foodService: FooditemsService,
    private authService: AuthService
  ) {
    this.userName = this.authService.getUsername();
  }

  ngOnInit(): void {
    this.menuForm = this.fb.group({
      mealDateId: ['', Validators.required],
      mealTypeId: ['', Validators.required],
      menuItemIds: [[], Validators.required]
    });

    this.loadDropdownData();
    this.loadPlannedMenus();

    this.itemFilterCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.filterMenuItems(search);
    });
  }

  loadDropdownData() {
    this.menuService.getMenuDates().subscribe(dates => this.menuDates = dates);
    this.menuService.getMealTypes().subscribe(meals => this.mealTypes = meals);
    this.foodService.getItems().subscribe(items => {
      this.menuItems = items;
      this.filteredMenuItems = items;
    });
  }

  filterMenuItems(search: string | null) {
    const filterValue = (search ?? '').toLowerCase();
    if (!filterValue) {
      this.filteredMenuItems = this.menuItems;
    } else {
      this.filteredMenuItems = this.menuItems.filter(item =>
        item.name.toLowerCase().includes(filterValue) ||
        item.description.toLowerCase().includes(filterValue)
      );
    }
  }

  getDateById(id: number): string {
  const date = this.menuDates.find(d => d.mealDateId === id);
  return date?.menuDate || '';
}

  onSubmit() {
  if (this.menuForm.invalid) {
    alert('Please select all required fields.');
    return;
  }
const { mealDateId, mealTypeId, menuItemIds } = this.menuForm.value;

  const isDuplicate = this.plannedMenus.some(menu =>
    new Date(menu.menuDate).getTime() === new Date(this.getDateById(mealDateId)).getTime() &&
    menu.mealTypes.some((mt: MealType) =>
  mt.mealTypeId === this.menuForm.value.mealTypeId
)
  );

  if (isDuplicate) {
    alert('This menu combination already exists.');
    return;
  }

  const payload = this.menuForm.value;
  payload.createdBy = this.userName;

  this.menuService.saveMenu(payload).subscribe({
    next: () => {
      alert('Menu saved successfully!');

      // Properly reset the form and its validation state
      this.menuForm.reset();
      Object.keys(this.menuForm.controls).forEach(key => {
        this.menuForm.get(key)?.setErrors(null); // clear errors
        this.menuForm.get(key)?.markAsPristine();
        this.menuForm.get(key)?.markAsUntouched();
      });

      // Reset filter search
      this.itemFilterCtrl.setValue('');

      // Optionally reload menu items or refresh dropdowns
      this.loadDropdownData(); // if needed
      this.loadPlannedMenus();
    },
    error: () => alert('Failed to save menu.')
  });
}

  loadPlannedMenus() {
  this.menuService.getPlannedMenus().subscribe(data => {
    this.plannedMenus = data;
  });
}
}
