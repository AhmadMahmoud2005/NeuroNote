import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';

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
  imports: [CommonModule, SlideBarComponent],
  templateUrl: './all-pages.component.html',
  styleUrl: './all-pages.component.css'
})
export class AllPagesComponent implements OnInit {
  activeWorkspace?: WorkspaceOption;
  notifications: NotificationItem[] = [];
  isNotificationsOpen = false;

  readonly recentNotes = [
    {
      label: 'Strategy',
      title: 'Q4 Product Roadmap',
      description: 'Aligning on key deliverables for the upcoming quarter. Focus heavily on...',
      edited: 'Edited 2h ago'
    },
    {
      label: 'Design',
      title: 'Design System V2',
      description: 'Migrating core components to Tailwind. Need to review the new...',
      edited: 'Edited Yesterday'
    }
  ];

  ngOnInit(): void {
    this.activeWorkspace = this.getActiveWorkspace();
    this.notifications = this.loadNotifications();
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
