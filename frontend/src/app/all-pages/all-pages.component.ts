import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { WorkspaceTopbarComponent } from '../workspace-topbar/workspace-topbar.component';
import { SettingsService, UserProfile } from '../services/settings.service';
import { InvitationsService } from '../services/invitations.service';
import { PagesService, PageDto } from '../services/pages.service';
import { WorkspacesService, Workspace } from '../services/workspaces.service';

interface RecentNote {
  id: number;
  label: string;
  title: string;
  description: string;
  edited: string;
}

@Component({
  selector: 'app-all-pages',
  standalone: true,
  imports: [CommonModule, FormsModule, SlideBarComponent, WorkspaceTopbarComponent, RouterLink],
  templateUrl: './all-pages.component.html',
  styleUrl: './all-pages.component.css'
})
export class AllPagesComponent implements OnInit {
  profile: UserProfile | null = null;
  displayName = 'Your name';
  activeWorkspace?: Workspace;
  pages: PageDto[] = [];
  showAllPages = false;
  isLoadingPages = false;

  inviteEmail = '';
  inviteStatusMessage = '';
  inviteErrorMessage = '';
  isInviting = false;
  lastInvitationToken = '';

  constructor(
    private readonly settings: SettingsService,
    private readonly invitationsService: InvitationsService,
    private readonly pagesService: PagesService,
    private readonly workspacesService: WorkspacesService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.resolveUserId();
    this.displayName = this.resolveDisplayName();

    if (userId) {
      this.settings.getProfile(userId).subscribe(profile => {
        this.profile = profile;
        this.displayName = profile.fullName ?? this.displayName;
      });
    }

    this.loadActiveWorkspace();
  }

  get initials(): string {
    const name = this.displayName || '';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  get recentNotes(): RecentNote[] {
    const source = this.showAllPages ? this.pages : this.pages.slice(0, 4);
    return source.map(page => ({
      id: page.id,
      label: page.isArchived ? 'Archived' : 'Page',
      title: page.title,
      description: `/${page.slug}`,
      edited: this.formatEdited(page)
    }));
  }

  toggleViewAll(): void {
    this.showAllPages = !this.showAllPages;
  }

  openPage(pageId: number): void {
    this.router.navigate(['/pages', pageId]);
  }

  sendInvite(): void {
    const email = this.inviteEmail.trim();
    if (!email) return;

    this.isInviting = true;
    this.inviteStatusMessage = '';
    this.inviteErrorMessage = '';

    const workspaceId = this.activeWorkspace?.id || Number(localStorage.getItem('activeWorkspaceId')) || 1;
    this.invitationsService.invite(workspaceId, { email, memberRole: 'Member' }).subscribe({
      next: invitation => {
        this.isInviting = false;
        this.inviteEmail = '';
        this.lastInvitationToken = invitation.token;
        this.inviteStatusMessage = 'Invitation sent successfully!';
      },
      error: err => {
        this.isInviting = false;
        this.inviteErrorMessage = err.error?.message || 'Could not send invitation.';
      }
    });
  }

  copyInviteLink(): void {
    const workspaceId = this.activeWorkspace?.id || Number(localStorage.getItem('activeWorkspaceId')) || 1;

    if (this.lastInvitationToken) {
      this.copyLink(`${window.location.origin}/register?token=${this.lastInvitationToken}`);
      return;
    }

    const email = this.inviteEmail.trim();
    if (!email) {
      this.inviteErrorMessage = 'Enter an email and send an invite first to generate a shareable link.';
      return;
    }

    this.isInviting = true;
    this.inviteErrorMessage = '';
    this.invitationsService.invite(workspaceId, { email, memberRole: 'Member' }).subscribe({
      next: invitation => {
        this.isInviting = false;
        this.lastInvitationToken = invitation.token;
        this.copyLink(`${window.location.origin}/register?token=${invitation.token}&email=${encodeURIComponent(email)}`);
      },
      error: err => {
        this.isInviting = false;
        this.inviteErrorMessage = err.error?.message || 'Could not generate invite link.';
      }
    });
  }

  private copyLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.inviteStatusMessage = 'Invite link copied to clipboard!';
      this.inviteErrorMessage = '';
    }).catch(() => {
      this.inviteErrorMessage = 'Failed to copy invite link.';
    });
  }

  private loadActiveWorkspace(): void {
    this.workspacesService.getAll().subscribe({
      next: workspaces => {
        const activeWorkspaceId = Number(localStorage.getItem('activeWorkspaceId')) || workspaces[0]?.id;
        this.activeWorkspace = workspaces.find(workspace => workspace.id === activeWorkspaceId) ?? workspaces[0];
        this.loadPages(this.activeWorkspace?.id ?? activeWorkspaceId);
      },
      error: () => {
        this.activeWorkspace = this.getActiveWorkspaceFallback();
        this.loadPages(this.activeWorkspace.id);
      }
    });
  }

  private loadPages(workspaceId: number): void {
    this.isLoadingPages = true;
    this.pagesService.listByWorkspace(workspaceId).subscribe({
      next: pages => {
        this.pages = pages.filter(page => !page.isArchived);
        this.isLoadingPages = false;
      },
      error: () => {
        this.pages = [];
        this.isLoadingPages = false;
      }
    });
  }

  private formatEdited(page: PageDto): string {
    const value = page.updatedAt ?? page.createdAt;
    if (!value) {
      return 'Recently updated';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Recently updated' : `Edited ${date.toLocaleDateString()}`;
  }

  private getActiveWorkspaceFallback(): Workspace {
    const storedWorkspaces = localStorage.getItem('workspaces');
    let workspaces: Workspace[] = [];

    if (storedWorkspaces) {
      try {
        workspaces = JSON.parse(storedWorkspaces) as Workspace[];
      } catch {
        workspaces = [];
      }
    }

    const activeWorkspaceId = Number(localStorage.getItem('activeWorkspaceId')) || workspaces[0]?.id || 1;
    return workspaces.find(workspace => workspace.id === activeWorkspaceId) ?? {
      id: activeWorkspaceId,
      name: 'Workspace',
      slug: 'workspace',
      ownerUserId: 0
    };
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
