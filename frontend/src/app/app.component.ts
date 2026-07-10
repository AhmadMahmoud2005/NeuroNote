import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavComponent } from './landing/nav/nav.component';
import { FooterComponent } from './landing/footer/footer.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'final-project';

  constructor(
    public readonly router: Router,
    private readonly authService: AuthService
  ) {}

  get showSiteChrome(): boolean {
    // If the user is logged in, never show the landing page header/footer
    if (this.authService.isLoggedIn) {
      return false;
    }
    // Only show on root, home and about pages for guests
    const guestRoutes = ['/', '/home', '/about'];
    return guestRoutes.includes(this.router.url.split('?')[0]);
  }
}
