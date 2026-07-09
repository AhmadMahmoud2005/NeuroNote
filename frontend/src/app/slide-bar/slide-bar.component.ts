import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WorkspaceService, WorkspaceResponse } from '../services/workspace.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-slide-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './slide-bar.component.html',
  styleUrl: './slide-bar.component.css'
})
export class SlideBarComponent implements OnInit {
  activeWorkspaceId = 1;
  workspaces: WorkspaceResponse[] = [];
  personalWorkspaces: WorkspaceResponse[] = [];
  sharedWorkspaces: WorkspaceResponse[] = [];

  // Toggle sections expand/collapse states
  isPersonalExpanded = true;
  isSharedExpanded = true;

  readonly navItems = [
    { label: 'Search', icon: 'search', route: '/search' },
    { label: 'New Page', icon: 'plus', route: '/new-page' },
    { label: 'All Pages', icon: 'page', route: '/all-pages' },
    { label: 'Tasks', icon: 'check', route: '/tasks' },
    { label: 'Shared Notes', icon: 'shared', route: '/shared-notes' }
  ];

  constructor(
    private readonly router: Router,
    private readonly workspaceService: WorkspaceService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser;
    const currentUserId = currentUser ? currentUser.userId : 0;

    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces = workspaces;
        this.personalWorkspaces = workspaces.filter(w => w.ownerUserId === currentUserId);
        this.sharedWorkspaces = workspaces.filter(w => w.ownerUserId !== currentUserId);
        this.activeWorkspaceId = this.getActiveWorkspaceId();
      },
      error: (err) => {
        console.error('Error loading workspaces from server:', err);
      }
    });
  }

  togglePersonalSection(): void {
    this.isPersonalExpanded = !this.isPersonalExpanded;
  }

  toggleSharedSection(): void {
    this.isSharedExpanded = !this.isSharedExpanded;
  }

  changeWorkspace(workspaceId: string | number): void {
    localStorage.setItem('activeWorkspaceId', String(workspaceId));
    window.location.reload();
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  private getActiveWorkspaceId(): number {
    const savedWorkspaceId = Number(localStorage.getItem('activeWorkspaceId'));
    const fallbackId = this.workspaces[0]?.id ?? 1;

    if (this.workspaces.some(w => w.id === savedWorkspaceId)) {
      return savedWorkspaceId;
    }

    localStorage.setItem('activeWorkspaceId', String(fallbackId));
    return fallbackId;
  }
}
