import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  standalone: true,
  imports: [RouterModule],
})
export class AppComponent { }
