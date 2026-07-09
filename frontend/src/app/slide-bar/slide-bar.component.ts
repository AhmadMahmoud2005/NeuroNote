import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface WorkspaceOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-slide-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './slide-bar.component.html',
  styleUrl: './slide-bar.component.css'
})
export class SlideBarComponent implements OnInit {
  activeWorkspaceId = 1;
  workspaces: WorkspaceOption[] = [];

  readonly navItems = [
    { label: 'Search', icon: 'search', route: '/search' },
    { label: 'New Page', icon: 'plus', route: '/new-page' },
    { label: 'All Pages', icon: 'page', route: '/all-pages' },
    { label: 'Tasks', icon: 'check', route: '/tasks' }
  
  ];

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.workspaces = this.loadWorkspaces();
    this.activeWorkspaceId = this.getActiveWorkspaceId();
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

    if (this.workspaces.some(workspace => workspace.id === savedWorkspaceId)) {
      return savedWorkspaceId;
    }

    localStorage.setItem('activeWorkspaceId', String(fallbackId));
    return fallbackId;
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
}
