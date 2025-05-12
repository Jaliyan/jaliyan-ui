import { Component, ViewChild,  AfterViewInit} from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatSidenav } from '@angular/material/sidenav';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

export interface Item {
  name: string;
  description: string;
}

@Component({
  selector: 'app-food-menu',
  standalone: false,
  templateUrl: './food-menu.component.html',
  styleUrl: './food-menu.component.css'
})
export class FoodMenuComponent implements AfterViewInit {
 @ViewChild('drawer') drawer!: MatSidenav;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

 newItem: Item = { name: '', description: '' };
 isEditMode = false;
 editedIndex: number | null = null;
 dataSource = new MatTableDataSource<Item>([]);
 displayedColumns: string[] = ['name', 'description', 'actions'];

 ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (data, filter) =>
  data.name.toLowerCase().includes(filter) || data.description.toLowerCase().includes(filter);

  }

openDrawer() {
    this.drawer.open();
  }

  // closeDrawer() {
  //   this.drawer.close();
  // }

   addItem(form: NgForm) {
    if (form.valid) {
      this.dataSource.data = [...this.dataSource.data, { ...this.newItem }];
      this.newItem = { name: '', description: '' };
      form.resetForm();
      this.drawer.close();
    }
  }

  editItem(item: any) {
  this.isEditMode = true;
  this.editedIndex = this.dataSource.data.indexOf(item);
  this.newItem = { ...item };
  this.drawer.open();
}

updateItem(form: NgForm) {
  if (form.invalid || this.editedIndex === null) return;
  this.dataSource.data[this.editedIndex] = { ...this.newItem };
  this.dataSource._updateChangeSubscription();
  this.closeDrawer();
  form.resetForm();
  this.isEditMode = false;
  this.editedIndex = null;
}

deleteItem(item: any) {
  const index = this.dataSource.data.indexOf(item);
  if (index > -1) {
    this.dataSource.data.splice(index, 1);
    this.dataSource._updateChangeSubscription();
  }
}

closeDrawer() {
  this.drawer.close();
  this.isEditMode = false;
  this.newItem = { name: '', description: '' };
  this.editedIndex = null;
}

  applyFilter(event: Event) {
  const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
  this.dataSource.filter = filterValue;
}

}
