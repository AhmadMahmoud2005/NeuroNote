import { Routes } from '@angular/router';
import { HomeComponent } from './landing/home/home.component';
import { AboutComponent } from './landing/about/about.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent }
];
