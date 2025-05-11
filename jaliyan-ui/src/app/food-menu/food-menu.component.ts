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
 dataSource = new MatTableDataSource<Item>([]);
 displayedColumns: string[] = ['name', 'description'];

 ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (data, filter) =>
  data.name.toLowerCase().includes(filter) || data.description.toLowerCase().includes(filter);
    
  }

openDrawer() {
    this.drawer.open();
  }

  closeDrawer() {
    this.drawer.close();
  }

   addItem(form: NgForm) {
    if (form.valid) {
      this.dataSource.data = [...this.dataSource.data, { ...this.newItem }];
      this.newItem = { name: '', description: '' };
      form.resetForm();
      this.drawer.close();
    }
  }

  applyFilter(event: Event) {
  const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
  this.dataSource.filter = filterValue;
}


}
