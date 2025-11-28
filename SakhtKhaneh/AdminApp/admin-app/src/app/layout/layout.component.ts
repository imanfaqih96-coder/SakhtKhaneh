import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { ProfileService, Profile } from '../services/profile.service';

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

  profile: Profile | null = null;

  @ViewChild('drawer') sidenav!: MatSidenav;

  @HostListener('window:resize')
  onResize() {
    this.checkSidebarForMobile();
    this.cd.detectChanges();
  }

  ngAfterViewInit() {
    this.checkSidebarForMobile(); // چک اولیه هنگام لود
    this.cd.detectChanges();
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
    private dialog: MatDialog,
    private profileService: ProfileService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {

    this.breakpoint.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.profileService.getProfile().subscribe({
      next: (data) => {
        var profileObj = {
          userName: data.userName,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        }
        this.profile = profileObj;
        this.cd.detectChanges();
        console.log('profile data', data);
      },
      error: (err) => {
        console.error(err);
        this.global.logout();
      }

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
