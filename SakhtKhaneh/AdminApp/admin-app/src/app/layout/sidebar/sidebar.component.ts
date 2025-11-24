import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MENU_ITEMS, MenuItem } from '../menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent {

  menu: MenuItem[] = MENU_ITEMS;
  activeRoute = '';

  constructor(private router: Router) {
    this.activeRoute = this.router.url;
    this.router.events.subscribe(() => {
      this.activeRoute = this.router.url;
    });
  }

  toggle(item: MenuItem) {
    item.open = !item.open;
  }

  isActive(item: MenuItem): boolean {
    if (item.route && this.router.url === item.route) return true;
    if (item.children) {
      return item.children.some(child => this.isActive(child));
    }
    return false;
  }
}
