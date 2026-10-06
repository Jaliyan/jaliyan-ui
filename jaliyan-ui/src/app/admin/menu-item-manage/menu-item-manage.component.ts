import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { FooditemsService } from '../../services/fooditems.service';
import { PadyatraService } from '../../services/padyatra.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { FoodItem } from '../../common/fooditem.model';
import { Padyatra } from '../../common/padyatra.model';

@Component({
  selector: 'app-menu-item-manage',
  templateUrl: './menu-item-manage.component.html',
  styleUrls: ['./menu-item-manage.component.css'],
  standalone: false
})
export class MenuItemManageComponent implements OnInit {
  displayedColumns = ['name', 'description', 'actions'];
  items: FoodItem[] = [];
  loading = true;
  saving = false;
  form!: FormGroup;
  editingId: number | null = null;
  userName: string;
  activePadyatra: Padyatra | null = null;

  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  constructor(
    private foodService: FooditemsService,
    private padyatraService: PadyatraService,
    private toast: ToastService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {
    this.userName = this.auth.getUsername() || 'Admin';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', Validators.maxLength(300)]
    });
    this.padyatraService.getActive().subscribe({
      next: (p) => this.activePadyatra = p ?? null,
      error: () => this.activePadyatra = null
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.foodService.getItems().subscribe({
      next: (data) => {
        this.items = data ?? [];
        this.loading = false;
      },
      error: () => {
        this.toast.show('Failed to load menu items.', 'error');
        this.loading = false;
      }
    });
  }

  edit(item: FoodItem): void {
    this.editingId = item.menuItemId ?? null;
    this.form.patchValue({ name: item.name, description: item.description });
  }

  cancelEdit(): void {
    this.editingId = null;
    // resetForm() also clears the directive's "submitted" flag so the required
    // error doesn't re-appear on the now-empty field after a successful save.
    this.formDir?.resetForm({ name: '', description: '' });
    this.form.reset({ name: '', description: '' });
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload: FoodItem = {
      name: this.form.value.name.trim(),
      description: (this.form.value.description || '').trim(),
      createdBy: this.userName,
      updatedBy: this.userName
    };

    const request$ = this.editingId
      ? this.foodService.updateItem(this.editingId, { ...payload, menuItemId: this.editingId })
      : this.foodService.addItem(payload);

    request$.subscribe({
      next: () => {
        this.toast.show(this.editingId ? 'Menu item updated.' : 'Menu item added.', 'success');
        this.saving = false;
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.saving = false;
        this.toast.show('Failed to save menu item.', 'error');
      }
    });
  }

  remove(item: FoodItem): void {
    const ok = confirm(`Delete menu item "${item.name}"?`);
    if (!ok) return;
    this.foodService.deleteItem({ ...item, updatedBy: this.userName }).subscribe({
      next: () => {
        this.toast.show('Menu item deleted.', 'success');
        if (this.editingId === item.menuItemId) this.cancelEdit();
        this.load();
      },
      error: () => this.toast.show('Failed to delete. It may be used in a planned menu.', 'error')
    });
  }
}
