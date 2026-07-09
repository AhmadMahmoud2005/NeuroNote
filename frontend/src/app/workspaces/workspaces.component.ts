import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { WorkspaceService, WorkspaceResponse } from '../services/workspace.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [CommonModule, SlideBarComponent, RouterLink, FormsModule],
  templateUrl: './workspaces.component.html',
  styleUrl: './workspaces.component.css'
})
export class WorkspacesComponent implements OnInit {
  personalWorkspaces: WorkspaceResponse[] = [];
  sharedWorkspaces: WorkspaceResponse[] = [];
  isLoading = true;

  // Create Workspace Form States
  name = '';
  description = '';
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  loadWorkspaces(): void {
    this.isLoading = true;
    const currentUser = this.authService.currentUser;
    const currentUserId = currentUser ? currentUser.userId : 0;

    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.personalWorkspaces = workspaces.filter(w => w.ownerUserId === currentUserId);
        this.sharedWorkspaces = workspaces.filter(w => w.ownerUserId !== currentUserId);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading workspaces:', err);
        this.isLoading = false;
      }
    });
  }

  openWorkspace(workspaceId: number): void {
    localStorage.setItem('activeWorkspaceId', String(workspaceId));
    this.router.navigate(['/all-pages']).then(() => {
      window.location.reload();
    });
  }

  onSubmit(): void {
    if (!this.name.trim()) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.workspaceService.createWorkspace({
      name: this.name.trim(),
      description: this.description.trim() || undefined
    }).subscribe({
      next: (newWS) => {
        this.isSubmitting = false;
        this.successMessage = `Workspace "${newWS.name}" created successfully!`;
        this.name = '';
        this.description = '';
        this.loadWorkspaces();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'An unexpected error occurred while creating the workspace.';
      }
    });
  }
}
