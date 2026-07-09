import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../models/auth.model';
import { PageService, PageResponse } from '../services/page.service';

interface WorkspaceOption {
  id: number;
  name: string;
}

interface NotificationItem {
  id: number;
  message: string;
  workspaceId: number;
  isAccepted: boolean;
}

@Component({
  selector: 'app-all-pages',
  standalone: true,
  imports: [CommonModule, SlideBarComponent, RouterLink],
  templateUrl: './all-pages.component.html',
  styleUrl: './all-pages.component.css'
})
export class AllPagesComponent implements OnInit {
  activeWorkspace?: WorkspaceOption;
  notifications: NotificationItem[] = [];
  isNotificationsOpen = false;
  currentUser: AuthUser | null = null;
  pages: PageResponse[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly pageService: PageService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.activeWorkspace = this.getActiveWorkspace();
    this.notifications = this.loadNotifications();
    this.loadPages();
  }

  get pendingNotifications(): NotificationItem[] {
    return this.notifications.filter(notification => !notification.isAccepted);
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  acceptNotification(notification: NotificationItem): void {
    this.notifications = this.notifications.map(item =>
      item.id === notification.id ? { ...item, isAccepted: true } : item
    );
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
    localStorage.setItem('activeWorkspaceId', String(notification.workspaceId));
    this.isNotificationsOpen = false;
    window.location.reload();
  }

  getAvatarCharacter(): string {
    if (!this.currentUser || !this.currentUser.fullName) return 'A';
    const trimmed = this.currentUser.fullName.trim();
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : 'A';
  }

  loadPages(): void {
    if (this.activeWorkspace) {
      this.pageService.getPages(this.activeWorkspace.id).subscribe({
        next: (pages) => {
          this.pages = pages;
        },
        error: (err) => {
          console.error('Error loading pages:', err);
        }
      });
    }
  }

  truncate(html: string, length: number): string {
    if (!html) return '';
    // Strip HTML tags for clean preview text
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  private getActiveWorkspace(): WorkspaceOption {
    const workspaces = this.loadWorkspaces();
    const activeWorkspaceId = Number(localStorage.getItem('activeWorkspaceId')) || workspaces[0].id;

    return workspaces.find(workspace => workspace.id === activeWorkspaceId) ?? workspaces[0];
  }

  private loadWorkspaces(): WorkspaceOption[] {
    const storedWorkspaces = localStorage.getItem('workspaces');

    if (storedWorkspaces) {
      try {
        const parsedWorkspaces = JSON.parse(storedWorkspaces) as WorkspaceOption[];

        if (Array.isArray(parsedWorkspaces) && parsedWorkspaces.length > 0) {
          return parsedWorkspaces;
        }
      } catch {
        localStorage.removeItem('workspaces');
      }
    }

    const defaultWorkspaces = [
      { id: 1, name: 'Deep Work Workspace' },
      { id: 2, name: 'Product Team' },
      { id: 3, name: 'Personal Notes' }
    ];

    localStorage.setItem('workspaces', JSON.stringify(defaultWorkspaces));
    return defaultWorkspaces;
  }

  private loadNotifications(): NotificationItem[] {
    const storedNotifications = localStorage.getItem('notifications');

    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications) as NotificationItem[];

        if (Array.isArray(parsedNotifications)) {
          return parsedNotifications;
        }
      } catch {
        localStorage.removeItem('notifications');
      }
    }

    const defaultNotifications = [
      {
        id: 1,
        message: 'Ali invited you to join Deep Work Workspace',
        workspaceId: 1,
        isAccepted: false
      }
    ];

    localStorage.setItem('notifications', JSON.stringify(defaultNotifications));
    return defaultNotifications;
  }
}
