import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';


import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [
    MatCardModule,
    MatToolbarModule
  ]
})
export class DashboardComponent {
  constructor(private global: GlobalService) { }

  logout() {
    this.global.logout();
  }
} 
