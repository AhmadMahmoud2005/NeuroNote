import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { WorkspaceService, WorkspaceResponse } from '../services/workspace.service';
import { PageService, PageResponse } from '../services/page.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [CommonModule, SlideBarComponent, RouterLink],
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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly workspaceService: WorkspaceService,
    private readonly pageService: PageService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUser?.userId || 0;

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
}
