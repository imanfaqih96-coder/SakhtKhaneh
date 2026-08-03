import { Component } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MENU, MenuItem } from '../menu';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatExpansionModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent {
  menu: MenuItem[] = MENU;

  constructor(public router: Router) { }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route || this.router.url.startsWith(`${route}/`);
  }

  hasActiveChild(item: MenuItem): boolean {
    return item.children?.some(child => this.isActive(child.route)) ?? false;
  }

  navigate(route?: string) {
    if (route) this.router.navigate([route]);
  }
}
