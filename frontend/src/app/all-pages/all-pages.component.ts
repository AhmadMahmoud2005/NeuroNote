import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../models/auth.model';
import { PageService, PageResponse, PageInvitation } from '../services/page.service';
import { WorkspaceService, WorkspaceInvitation, WorkspaceResponse } from '../services/workspace.service';

@Component({
  selector: 'app-all-pages',
  standalone: true,
  imports: [CommonModule, SlideBarComponent, RouterLink, FormsModule],
  templateUrl: './all-pages.component.html',
  styleUrl: './all-pages.component.css'
})
export class AllPagesComponent implements OnInit {
  activeWorkspaceId = 1;
  activeWorkspaceName = 'Personal Workspace';
  workspaces: WorkspaceResponse[] = [];
  pendingInvitations: WorkspaceInvitation[] = [];
  pendingPageInvitations: PageInvitation[] = [];
  isNotificationsOpen = false;
  currentUser: AuthUser | null = null;
  pages: PageResponse[] = [];
  sharedPages: PageResponse[] = [];

  // Workspace Invite Form States
  inviteInput = '';
  inviteSuccessMessage = '';
  inviteErrorMessage = '';
  isInviting = false;

  constructor(
    private readonly authService: AuthService,
    private readonly pageService: PageService,
    private readonly workspaceService: WorkspaceService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.activeWorkspaceId = Number(localStorage.getItem('activeWorkspaceId')) || 1;

    this.loadWorkspacesAndData();
    this.loadInvitations();
  }

  loadWorkspacesAndData(): void {
    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces = workspaces;
        const currentWS = workspaces.find(w => w.id === this.activeWorkspaceId);
        if (currentWS) {
          this.activeWorkspaceName = currentWS.name;
        } else if (workspaces.length > 0) {
          this.activeWorkspaceId = workspaces[0].id;
          this.activeWorkspaceName = workspaces[0].name;
          localStorage.setItem('activeWorkspaceId', String(workspaces[0].id));
        }
        this.loadPages();
        this.loadSharedPages();
      },
      error: (err) => {
        console.error('Error loading workspaces:', err);
        this.loadPages();
        this.loadSharedPages();
      }
    });
  }

  loadInvitations(): void {
    this.workspaceService.getInvitations().subscribe({
      next: (invitations) => {
        this.pendingInvitations = invitations;
      },
      error: (err) => {
        console.error('Error loading workspace invitations:', err);
      }
    });

    this.pageService.getPageInvitations().subscribe({
      next: (invitations) => {
        this.pendingPageInvitations = invitations;
      },
      error: (err) => {
        console.error('Error loading page invitations:', err);
      }
    });
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  respondInvitation(invitation: WorkspaceInvitation, accept: boolean): void {
    this.workspaceService.respondToInvitation(invitation.id, accept).subscribe({
      next: () => {
        this.loadInvitations();
        if (accept) {
          // Switch to accepted workspace and reload
          localStorage.setItem('activeWorkspaceId', String(invitation.workspaceId));
          window.location.reload();
        }
      },
      error: (err) => {
        console.error('Error responding to workspace invitation:', err);
      }
    });
  }

  respondPageInvitation(invitation: PageInvitation, accept: boolean): void {
    this.pageService.respondToPageInvitation(invitation.id, accept).subscribe({
      next: () => {
        this.loadInvitations();
        this.loadSharedPages();
      },
      error: (err) => {
        console.error('Error responding to page invitation:', err);
      }
    });
  }

  getAvatarCharacter(): string {
    if (!this.currentUser || !this.currentUser.fullName) return 'A';
    const trimmed = this.currentUser.fullName.trim();
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : 'A';
  }

  loadPages(): void {
    this.pageService.getPages(this.activeWorkspaceId).subscribe({
      next: (pages) => {
        this.pages = pages;
      },
      error: (err) => {
        console.error('Error loading pages:', err);
      }
    });
  }

  loadSharedPages(): void {
    this.pageService.getSharedPages().subscribe({
      next: (pages) => {
        this.sharedPages = pages;
      },
      error: (err) => {
        console.error('Error loading shared pages:', err);
      }
    });
  }

  sendWorkspaceInvite(): void {
    const input = this.inviteInput.trim();
    if (!input) return;

    this.isInviting = true;
    this.inviteSuccessMessage = '';
    this.inviteErrorMessage = '';

    this.workspaceService.inviteUser(this.activeWorkspaceId, input, 'Member').subscribe({
      next: (res) => {
        this.isInviting = false;
        this.inviteSuccessMessage = res.message || 'Invitation sent successfully!';
        this.inviteInput = '';
      },
      error: (err) => {
        this.isInviting = false;
        this.inviteErrorMessage = err.error?.message || 'Failed to send invitation. Make sure the user exists and is not already a member.';
      }
    });
  }

  truncate(html: string, length: number): string {
    if (!html) return '';
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  formatToCairoTime(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
