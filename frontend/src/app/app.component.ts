import { Component, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit {
  title = 'final-project';

  constructor(
    public readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark-theme', isDark);

    const isCompact = localStorage.getItem('compactLayout') !== 'false';
    document.body.classList.toggle('compact-layout', isCompact);
  }

  get showSiteChrome(): boolean {
    // Only show on root, home and about pages (landing pages)
    const guestRoutes = ['/', '/home', '/about'];
    return guestRoutes.includes(this.router.url.split('?')[0]);
  }
}
