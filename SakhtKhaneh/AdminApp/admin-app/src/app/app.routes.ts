import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.gaurd';
import { UsersComponent } from './pages/users/all/users.component';
import { NewUserComponent } from './pages/users/new/new-user.component';
import { ProjectsComponent } from './pages/projects/all/projects.component';
import { NewProjectComponent } from './pages/projects/new-project/new-project';
import { EditProjectComponent } from './pages/projects/edit-project/edit-project';
import { BlogPostsComponent } from './pages/blog_posts/all/posts.component';
import { NewBlogPostComponent } from './pages/blog_posts/new/new-blog-post.component';



export const routes: Routes = [

  // صفحات عمومی
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [loginGuard] },

  // صفحات محافظت شده - داخل پوسته layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'users/all', component: UsersComponent },
      { path: 'users/new', component: NewUserComponent },
      { path: 'projects/all', component: ProjectsComponent },
      { path: 'projects/new', component: NewProjectComponent },
      { path: 'projects/edit/:project_guid', component: EditProjectComponent },
      { path: 'blog-posts/all', component: BlogPostsComponent },
      { path: 'blog-posts/new', component: NewBlogPostComponent }
      // صفحه‌های دیگر نیز همینجا
      // { path: 'users', component: UsersComponent },
    ]
  },
  // ریدایرکت
  { path: '**', redirectTo: 'login' }
];
