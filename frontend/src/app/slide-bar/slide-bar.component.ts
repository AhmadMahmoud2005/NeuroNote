import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WorkspacesService, Workspace } from '../services/workspaces.service';

@Component({
  selector: 'app-slide-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './slide-bar.component.html',
  styleUrl: './slide-bar.component.css'
})
export class SlideBarComponent implements OnInit {
  activeWorkspaceId = 1;
  workspaces: Workspace[] = [];

  readonly navItems = [
    { label: 'Search', icon: 'search', route: '/search' },
    { label: 'New Page', icon: 'plus', route: '/new-page' },
    { label: 'All Pages', icon: 'page', route: '/all-pages' },
    { label: 'Tasks', icon: 'check', route: '/tasks' }
  ];

  constructor(
    private readonly router: Router,
    private readonly workspacesService: WorkspacesService
  ) {}

  ngOnInit(): void {
    this.workspacesService.getAll().subscribe({
      next: workspaces => {
        this.workspaces = workspaces;
        this.activeWorkspaceId = this.getActiveWorkspaceId();
      },
      error: () => {
        this.workspaces = this.loadWorkspacesFallback();
        this.activeWorkspaceId = this.getActiveWorkspaceId();
      }
    });
  }

  changeWorkspace(workspaceId: string | number): void {
    localStorage.setItem('activeWorkspaceId', String(workspaceId));
    window.location.reload();
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(`${route}/`);
  }

  private getActiveWorkspaceId(): number {
    const savedWorkspaceId = Number(localStorage.getItem('activeWorkspaceId'));
    const fallbackId = this.workspaces[0]?.id ?? 1;

    if (this.workspaces.some(workspace => workspace.id === savedWorkspaceId)) {
      return savedWorkspaceId;
    }

    localStorage.setItem('activeWorkspaceId', String(fallbackId));
    return fallbackId;
  }

  private loadWorkspacesFallback(): Workspace[] {
    const storedWorkspaces = localStorage.getItem('workspaces');

    if (storedWorkspaces) {
      try {
        const parsedWorkspaces = JSON.parse(storedWorkspaces) as Workspace[];

        if (Array.isArray(parsedWorkspaces) && parsedWorkspaces.length > 0) {
          return parsedWorkspaces;
        }
      } catch {
        localStorage.removeItem('workspaces');
      }
    }

    return [];
  }
}
