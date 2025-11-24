import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {
  constructor(private global: GlobalService) { }

  logout() {
    this.global.logout();
  }
} 
