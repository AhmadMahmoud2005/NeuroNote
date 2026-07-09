import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { WorkspaceService, WorkspaceResponse } from '../services/workspace.service';

@Component({
  selector: 'app-edit-workspace',
  standalone: true,
  imports: [CommonModule, SlideBarComponent, RouterLink, FormsModule],
  templateUrl: './edit-workspace.component.html',
  styleUrl: './edit-workspace.component.css'
})
export class EditWorkspaceComponent implements OnInit {
  workspaceId!: number;
  name = '';
  description = '';
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly workspaceService: WorkspaceService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.workspaceId = Number(params['id']);
      if (this.workspaceId) {
        this.loadWorkspaceData();
      } else {
        this.router.navigate(['/workspaces']);
      }
    });
  }

  loadWorkspaceData(): void {
    this.isLoading = true;
    this.workspaceService.getWorkspace(this.workspaceId).subscribe({
      next: (ws) => {
        this.name = ws.name;
        this.description = ws.description || '';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading workspace details:', err);
        this.router.navigate(['/workspaces']);
      }
    });
  }

  onSubmit(): void {
    if (!this.name.trim() || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    this.workspaceService.updateWorkspace(this.workspaceId, {
      name: this.name.trim(),
      description: this.description.trim() || undefined
    }).subscribe({
      next: (updatedWS) => {
        this.isSubmitting = false;
        this.router.navigate(['/workspace-detail'], { queryParams: { id: updatedWS.id } });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to update workspace. Please try again.';
      }
    });
  }
}
