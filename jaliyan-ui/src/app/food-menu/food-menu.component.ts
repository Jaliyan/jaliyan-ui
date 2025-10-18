import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatSidenav } from '@angular/material/sidenav';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FooditemsService } from '../services/fooditems.service';
import { FoodItem } from '../common/fooditem.model';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-food-menu',
  standalone: false,
  templateUrl: './food-menu.component.html',
  styleUrl: './food-menu.component.css'
})
export class FoodMenuComponent implements AfterViewInit, OnInit {
  @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  newItem: FoodItem = { name: '', description: '' };
  isEditMode = false;
  currentItemId: number | null = null;
  dataSource = new MatTableDataSource<FoodItem>([]);
  displayedColumns: string[] = ['name', 'description', 'actions'];
  userName: any;


  constructor(private foodItemService: FooditemsService, private authService: AuthService,
    private toastService: ToastService
  ) {
    this.userName = this.authService.getUsername();
  }

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems() {
    this.foodItemService.getItems().subscribe(data => {
      this.dataSource.data = data;
      // this.dataSource.paginator = this.paginator;
    }, (err) => {
      this.toastService.show('Failed to load Menu Items.', 'error');
    }
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (data, filter) =>
      data.name.toLowerCase().includes(filter) || data.description.toLowerCase().includes(filter);

  }

  openDrawer() {
    this.isEditMode = false;
    this.newItem = { name: '', description: '' };
    this.drawer.open();
  }

  // closeDrawer() {
  //   this.drawer.close();
  // }

  addItem(form: any) {
    this.newItem.createdBy = this.userName;
    this.foodItemService.addItem(this.newItem).subscribe(() => {
      this.loadItems();
      this.closeDrawer();
      this.toastService.show(`${this.newItem.name} Added successufully`, 'success');
      form.resetForm({
        name: '',
        description: ''
      });
    }, (err) => {
      this.toastService.show('Error while adding new item.', 'error');
    });
  }

  editItem(item: FoodItem) {
    this.isEditMode = true;
    this.newItem = { ...item };
    this.currentItemId = item.menuItemId!;
    if (this.drawer.opened) this.drawer.close().then(() => this.drawer.open());
    else this.drawer.open();
  }

  updateItem(form: any) {
    if (!this.currentItemId) return;
    this.newItem.updatedBy = this.userName
    this.newItem.isActive = true;
    this.foodItemService.updateItem(this.currentItemId, this.newItem).subscribe(() => {
      this.loadItems();
      this.closeDrawer();
      this.toastService.show(`${this.newItem.name} updated successufully`, 'success');
      form.resetForm({
        name: '',
        description: ''
      });
      
      
    }, (err) => {
      this.toastService.show(`Error while updating ${this.newItem.name}.`, 'error');
    });
  }

  deleteItem(item: FoodItem) {
    if (confirm(`Are you sure you want to delete - ${item.name}?`)) {
      if (item.menuItemId) {
        item.updatedBy = this.userName
        this.foodItemService.deleteItem(item).subscribe(() => {
          this.loadItems()
          this.toastService.show(`${item.name} deleted successufully`, 'success');
        },
          (err) => {
            this.toastService.show(`Error while deleting ${item.name}.`, 'error');
          }
        );

      }
    }

  }

  // closeDrawer() {
  //   this.drawer.close();
  //   this.isEditMode = false;
  //   this.newItem = { name: '', description: '' };
  //   this.editedIndex = null;
  // }

  closeDrawer() {
    this.drawer.close();
  }

  applyFilter(event: KeyboardEvent) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }
}
