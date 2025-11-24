import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalService } from '../services/global.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
  standalone: true,
  imports: [
    RouterOutlet
  ]
})
export class LayoutComponent {
  constructor(private global: GlobalService) { }

  logout() {
    this.global.logout();
  }
}
