import { Component, OnInit } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';
import { GlobalService } from '../services/global.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class LayoutComponent implements OnInit {

  isMobile = false;
  constructor(
    private global: GlobalService,
    private breakpoint: BreakpointObserver
  ) { }

  ngOnInit() {
    this.breakpoint.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  logout() {
    this.global.logout();
  }
}
