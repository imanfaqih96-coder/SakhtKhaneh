import { Component, OnInit } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { HostListener, ViewChild } from '@angular/core'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterOutlet } from '@angular/router';
import { GlobalService } from '../services/global.service';
import { CommonModule } from '@angular/common';
import { LogoutConfirmationDialogComponent } from '../pages/components/logout/logout-confirmation-dialog.component';

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
    MatButtonModule,
    MatTooltipModule
  ]
})
export class LayoutComponent implements OnInit {

  @ViewChild('drawer') sidenav!: MatSidenav;

  @HostListener('window:resize')
  onResize() {
    this.checkSidebarForMobile();
  }

  ngAfterViewInit() {
    this.checkSidebarForMobile(); // چک اولیه هنگام لود
  }

  private checkSidebarForMobile() {
    const mobileBreakpoint = 768;
    if (window.innerWidth < mobileBreakpoint && this.sidenav?.opened) {
      this.sidenav.close();
    }
  }

  isMobile = false;
  constructor(
    private global: GlobalService,
    private breakpoint: BreakpointObserver,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.breakpoint.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  logout() {
    const dialogRef = this.dialog.open(LogoutConfirmationDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.global.logout();
      }
    });
  }
}
