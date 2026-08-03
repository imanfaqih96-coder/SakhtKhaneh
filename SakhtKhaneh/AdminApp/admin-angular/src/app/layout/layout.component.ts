import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterOutlet } from '@angular/router';
import { GlobalService } from '../services/global.service';
import { LogoutConfirmationDialogComponent } from '../pages/components/logout/logout-confirmation-dialog.component';
import { Profile, ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, SidebarComponent, MatToolbarModule, MatSidenavModule, MatIconModule, MatButtonModule, MatTooltipModule]
})
export class LayoutComponent implements OnInit, OnDestroy {
  profile: Profile | null = null;
  isMobile = false;
  private readonly destroy$ = new Subject<void>();
  @ViewChild('drawer') sidenav!: MatSidenav;

  constructor(
    private readonly global: GlobalService,
    private readonly breakpoint: BreakpointObserver,
    private readonly dialog: MatDialog,
    private readonly profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.breakpoint.observe([Breakpoints.Handset]).pipe(takeUntil(this.destroy$)).subscribe(result => this.isMobile = result.matches);
    this.profileService.getProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: data => this.profile = data,
      error: () => this.global.logout()
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeOnMobile(): void { if (this.isMobile) this.sidenav?.close(); }

  logout(): void {
    this.dialog.open(LogoutConfirmationDialogComponent, { width: '400px', disableClose: true })
      .afterClosed().subscribe(result => { if (result === true) this.global.logout(); });
  }
}
