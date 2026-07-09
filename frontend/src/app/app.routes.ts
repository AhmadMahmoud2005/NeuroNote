import { Routes } from '@angular/router';
import { HomeComponent } from './landing/home/home.component';
import { AboutComponent } from './landing/about/about.component';
import { LoginComponent } from './auth/login/login.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { AllPagesComponent } from './all-pages/all-pages.component';
import { TasksComponent } from './tasks/tasks.component';
import { NewPageComponent } from './new-page/new-page.component';
import { SearchComponent } from './search/search.component';
import { SettingsComponent } from './settings/settings.component';
import { authGuard } from './guards/auth.guard';
import { pendingChangesGuard } from './guards/pending-changes.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: SignUpComponent },
  { path: 'all-pages', component: AllPagesComponent, canActivate: [authGuard] },
  { path: 'tasks', component: TasksComponent, canActivate: [authGuard] },
  { path: 'new-page', component: NewPageComponent, canActivate: [authGuard], canDeactivate: [pendingChangesGuard] },
  { path: 'search', component: SearchComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] }
];
