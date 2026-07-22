import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PadyatraService } from '../../services/padyatra.service';
import { Padyatra } from '../../common/padyatra.model';

interface AdminTile {
  title: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  activePadyatra: Padyatra | null = null;
  loading = true;

  tiles: AdminTile[] = [
    {
      title: 'Padyatra Events',
      description: 'Create a new year, activate an event, edit dates and names.',
      icon: 'event',
      route: '/admin/padyatra'
    },
    {
      title: 'Route Stops',
      description: 'Add, update or remove stops and Google Maps locations.',
      icon: 'place',
      route: '/admin/stops'
    },
    {
      title: 'Menu Items',
      description: 'Maintain the master list of food / menu items.',
      icon: 'restaurant_menu',
      route: '/admin/menu-items'
    },
    {
      title: 'Menu Planner',
      description: 'Plan which menu is served on which day and meal.',
      icon: 'calendar_month',
      route: '/menuplanner'
    },
    {
      title: 'Past Data',
      description: 'Browse registrations, stops and menus of previous years.',
      icon: 'history',
      route: '/admin/archive'
    }
  ];

  constructor(
    private padyatraService: PadyatraService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.padyatraService.getActive().subscribe({
      next: (p) => {
        this.activePadyatra = p ?? null;
        this.loading = false;
      },
      error: () => {
        this.activePadyatra = null;
        this.loading = false;
      }
    });
  }

  open(tile: AdminTile): void {
    this.router.navigateByUrl(tile.route);
  }
}
