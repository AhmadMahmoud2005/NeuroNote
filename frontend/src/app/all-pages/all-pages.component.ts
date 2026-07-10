import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  pages: PageResponse[] = [];
  sharedPages: PageResponse[] = [];
  personalWorkspaces: WorkspaceResponse[] = [];
  sharedWorkspaces: WorkspaceResponse[] = [];
  pendingInvitations: WorkspaceInvitation[] = [];
  pendingPageInvitations: PageInvitation[] = [];
  isNotificationsOpen = false;
  currentUser: AuthUser | null = null;
  isLoading = true;

  // Search in Topbar
  topbarQuery = '';

  constructor(
    private readonly authService: AuthService,
    private readonly pageService: PageService,
    private readonly workspaceService: WorkspaceService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadWorkspaces();
    this.loadData();
    this.loadInvitations();
  }

  onTopbarSearch(): void {
    const q = this.topbarQuery.trim();
    if (q) {
      this.router.navigate(['/search'], { queryParams: { q } });
    }
  }

  loadWorkspaces(): void {
    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        if (this.currentUser) {
          const userId = this.currentUser.userId;
          this.personalWorkspaces = workspaces.filter(w => w.ownerUserId === userId);
          this.sharedWorkspaces = workspaces.filter(w => w.ownerUserId !== userId);
        } else {
          this.personalWorkspaces = workspaces;
          this.sharedWorkspaces = [];
        }
      },
      error: (err) => {
        console.error('Error loading workspaces for Home dashboard:', err);
      }
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.pageService.getAllPages().subscribe({
      next: (pages) => {
        this.pages = pages;
        this.loadSharedPages();
      },
      error: (err) => {
        console.error('Error loading all pages:', err);
        this.loadSharedPages();
      }
    });
  }

  loadSharedPages(): void {
    this.pageService.getSharedPages().subscribe({
      next: (pages) => {
        this.sharedPages = pages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading shared pages:', err);
        this.isLoading = false;
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
        this.loadData();
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
