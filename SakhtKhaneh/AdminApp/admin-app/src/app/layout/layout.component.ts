import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalService } from '../services/global.service';
import { SidebarComponent } from './sidebar/sidebar.component';


@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent
  ]
})
export class LayoutComponent {
  constructor(private global: GlobalService) { }

  logout() {
    this.global.logout();
  }
}
