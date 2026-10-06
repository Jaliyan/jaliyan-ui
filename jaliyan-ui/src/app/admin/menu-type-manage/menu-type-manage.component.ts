import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MenuTypeService } from '../../services/menu-type.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { MenuType } from '../../common/menu-type.model';

@Component({
  selector: 'app-menu-type-manage',
  templateUrl: './menu-type-manage.component.html',
  styleUrls: ['./menu-type-manage.component.css'],
  standalone: false
})
export class MenuTypeManageComponent implements OnInit {
  displayedColumns = ['name', 'actions'];
  items: MenuType[] = [];
  loading = true;
  saving = false;
  form!: FormGroup;
  editingId: number | null = null;
  userName: string;

  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  constructor(
    private menuTypeService: MenuTypeService,
    private toast: ToastService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {
    this.userName = this.auth.getUsername() || 'Admin';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]]
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.menuTypeService.getAll().subscribe({
      next: (data) => {
        this.items = data ?? [];
        this.loading = false;
      },
      error: () => {
        this.toast.show('Failed to load menu types.', 'error');
        this.loading = false;
      }
    });
  }

  edit(item: MenuType): void {
    this.editingId = item.menuTypeId ?? null;
    this.form.patchValue({ name: item.name });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.formDir?.resetForm({ name: '' });
    this.form.reset({ name: '' });
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload: MenuType = {
      name: this.form.value.name.trim(),
      createdBy: this.userName,
      updatedBy: this.userName
    };

    const request$ = this.editingId
      ? this.menuTypeService.update({ ...payload, menuTypeId: this.editingId })
      : this.menuTypeService.create(payload);

    request$.subscribe({
      next: () => {
        this.toast.show(this.editingId ? 'Menu type updated.' : 'Menu type added.', 'success');
        this.saving = false;
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.saving = false;
        this.toast.show('Failed to save menu type.', 'error');
      }
    });
  }

  remove(item: MenuType): void {
    const ok = confirm(`Delete menu type "${item.name}"?`);
    if (!ok) return;
    this.menuTypeService.delete(item.menuTypeId!, this.userName).subscribe({
      next: () => {
        this.toast.show('Menu type deleted.', 'success');
        if (this.editingId === item.menuTypeId) this.cancelEdit();
        this.load();
      },
      error: () => this.toast.show('Failed to delete. It may be used in a planned menu.', 'error')
    });
  }
}
