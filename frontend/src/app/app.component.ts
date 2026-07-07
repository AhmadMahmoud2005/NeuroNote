import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavComponent } from './landing/nav/nav.component';
import { FooterComponent } from './landing/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'final-project';

  constructor(public router: Router) {}

  get isAuthPage(): boolean {
    return this.router.url === '/login' || this.router.url === '/register';
  }
}
