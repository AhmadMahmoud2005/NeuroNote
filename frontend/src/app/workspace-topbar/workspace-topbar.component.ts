import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InvitationsService, NotificationDto } from '../services/invitations.service';
import { SettingsService, UserProfile } from '../services/settings.service';
@Component({
  selector: 'app-workspace-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './workspace-topbar.component.html',
  styleUrl: './workspace-topbar.component.css'
})
export class WorkspaceTopbarComponent implements OnInit {
  displayName = 'Your name';
  notifications: NotificationDto[] = [];
  isNotificationsOpen = false;
  isProfileOpen = false;
  profile: UserProfile | null = null;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly invitationsService: InvitationsService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.resolveUserId();
    this.displayName = this.resolveDisplayName();

    if (userId) {
      this.settingsService.getProfile(userId).subscribe(profile => {
        this.profile = profile;
        this.displayName = profile.fullName || this.displayName;
      });

      this.invitationsService.getNotifications().subscribe({
        next: notifications => {
          this.notifications = notifications;
        },
        error: () => {
          this.notifications = [];
        }
      });
    }
  }

  get initials(): string {
    const name = this.profile?.fullName || this.displayName || '';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'A';
  }

  get pendingNotifications(): NotificationDto[] {
    return this.notifications;
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      this.isProfileOpen = false;
    }
  }

  toggleProfile(): void {
    this.isProfileOpen = !this.isProfileOpen;
    if (this.isProfileOpen) {
      this.isNotificationsOpen = false;
    }
  }

  acceptNotification(notification: NotificationDto): void {
    this.invitationsService.accept(notification.token).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(item => item.id !== notification.id);
        localStorage.setItem('activeWorkspaceId', String(notification.workspaceId));
        this.isNotificationsOpen = false;
        window.location.reload();
      },
      error: () => {
        alert('Could not accept the invitation.');
      }
    });
  }

  declineNotification(notification: NotificationDto): void {
    this.invitationsService.decline(notification.token).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(item => item.id !== notification.id);
      },
      error: () => {
        alert('Could not decline the invitation.');
      }
    });
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('userId');
    localStorage.removeItem('settingsProfile');
    this.isProfileOpen = false;
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  closeMenus(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.topbar-actions')) {
      return;
    }

    this.isNotificationsOpen = false;
    this.isProfileOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.isNotificationsOpen = false;
    this.isProfileOpen = false;
  }

  private resolveUserId(): number {
    let userId = Number(localStorage.getItem('userId')) || 0;

    try {
      const authUserRaw = localStorage.getItem('authUser');
      if (authUserRaw) {
        const parsed = JSON.parse(authUserRaw);
        userId = userId || parsed.id || parsed.Id || 0;
      }
    } catch {
      // ignore parse errors
    }

    return userId;
  }

  private resolveDisplayName(): string {
    try {
      const authUserRaw = localStorage.getItem('authUser');
      if (authUserRaw) {
        const parsed = JSON.parse(authUserRaw);
        return parsed.fullName || parsed.FullName || 'Your name';
      }
    } catch {
      // ignore parse errors
    }

    return 'Your name';
  }
}
