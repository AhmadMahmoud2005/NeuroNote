import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { WorkspaceService, WorkspaceResponse, WorkspaceInvitation, WorkspaceMember } from '../services/workspace.service';
import { PageService, PageResponse, PageInvitation } from '../services/page.service';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../models/auth.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [CommonModule, SlideBarComponent, RouterLink, FormsModule],
  templateUrl: './workspace-detail.component.html',
  styleUrl: './workspace-detail.component.css'
})
export class WorkspaceDetailComponent implements OnInit {
  workspaceId!: number;
  workspace!: WorkspaceResponse;
  pages: PageResponse[] = [];
  isLoading = true;
  isOwner = false;
  currentUserId = 0;
  currentUser: AuthUser | null = null;

  // Workspace Invite Form States
  inviteInput = '';
  inviteSuccessMessage = '';
  inviteErrorMessage = '';
  isInviting = false;

  // Notifications Topbar States
  pendingInvitations: WorkspaceInvitation[] = [];
  pendingPageInvitations: PageInvitation[] = [];
  isNotificationsOpen = false;

  // Search in Topbar
  topbarQuery = '';

  // Collaborators display state
  showCollaborators = false;
  collaborators: WorkspaceMember[] = [];
  loadingCollaborators = false;

  onTopbarSearch(): void {
    const q = this.topbarQuery.trim();
    if (q) {
      this.router.navigate(['/search'], { queryParams: { q, workspaceId: this.workspaceId } });
    }
  }

  toggleCollaborators(): void {
    this.showCollaborators = !this.showCollaborators;
    if (this.showCollaborators) {
      this.loadCollaborators();
    }
  }

  loadCollaborators(): void {
    this.loadingCollaborators = true;
    this.workspaceService.getWorkspaceMembers(this.workspaceId).subscribe({
      next: (members) => {
        this.collaborators = members;
        this.loadingCollaborators = false;
      },
      error: (err) => {
        console.error('Error loading collaborators:', err);
        this.loadingCollaborators = false;
      }
    });
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly workspaceService: WorkspaceService,
    private readonly pageService: PageService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.currentUserId = this.currentUser?.userId || 0;

    this.route.queryParams.subscribe(params => {
      this.workspaceId = Number(params['id']);
      if (this.workspaceId) {
        this.loadWorkspaceData();
        this.loadInvitations();
      } else {
        this.router.navigate(['/workspaces']);
      }
    });
  }

  loadWorkspaceData(): void {
    this.isLoading = true;
    this.workspaceService.getWorkspace(this.workspaceId).subscribe({
      next: (ws) => {
        this.workspace = ws;
        this.isOwner = ws.ownerUserId === this.currentUserId;
        this.loadPages();
      },
      error: (err) => {
        console.error('Error loading workspace:', err);
        this.router.navigate(['/workspaces']);
      }
    });
  }

  loadPages(): void {
    this.pageService.getPages(this.workspaceId).subscribe({
      next: (pages) => {
        this.pages = pages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading pages for workspace:', err);
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
        this.loadPages();
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

  deleteWorkspace(): void {
    if (!this.isOwner) return;
    if (confirm(`Are you sure you want to delete workspace "${this.workspace.name}"? This action cannot be undone.`)) {
      this.workspaceService.deleteWorkspace(this.workspaceId).subscribe({
        next: () => {
          localStorage.removeItem('activeWorkspaceId');
          this.router.navigate(['/workspaces']).then(() => {
            window.location.reload();
          });
        },
        error: (err) => {
          console.error('Error deleting workspace:', err);
          alert('Failed to delete workspace. Please try again.');
        }
      });
    }
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

  sendWorkspaceInvite(): void {
    const input = this.inviteInput.trim();
    if (!input) return;

    this.isInviting = true;
    this.inviteSuccessMessage = '';
    this.inviteErrorMessage = '';

    this.workspaceService.inviteUser(this.workspaceId, input, 'Member').subscribe({
      next: (res) => {
        this.isInviting = false;
        this.inviteSuccessMessage = res.message || 'Invitation sent successfully!';
        this.inviteInput = '';
      },
      error: (err) => {
        this.isInviting = false;
        this.inviteErrorMessage = err.error?.message || 'Failed to send invitation.';
      }
    });
  }
}
