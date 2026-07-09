import { Routes } from '@angular/router';
import { HomeComponent } from './landing/home/home.component';
import { AboutComponent } from './landing/about/about.component';
import { LoginComponent } from './auth/login/login.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { WorkspacesComponent } from './workspaces/workspaces.component';
import { NewWorkspaceComponent } from './workspaces/new-workspace.component';
import { AllPagesComponent } from './all-pages/all-pages.component';
import { TasksComponent } from './tasks/tasks.component';
import { NewPageComponent } from './new-page/new-page.component';
import { SearchComponent } from './search/search.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: SignUpComponent },
  { path: 'workspaces', component: WorkspacesComponent },
  { path: 'workspaces/new', component: NewWorkspaceComponent },
  { path: 'all-pages', component: AllPagesComponent },
  { path: 'tasks', component: TasksComponent },
  { path: 'new-page', component: NewPageComponent },
  { path: 'search', component: SearchComponent },
  { path: 'settings', component: SettingsComponent }
];
