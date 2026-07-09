import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkspacesService, Workspace } from '../services/workspaces.service';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './workspaces.component.html',
  styleUrl: './workspaces.component.css'
})
export class WorkspacesComponent implements OnInit {
  workspaces: Workspace[] = [];
  loading = false;
  error = '';

  constructor(private readonly ws: WorkspacesService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    this.loading = true;
    this.error = '';
    this.ws.getAll().subscribe({ next: data => { this.workspaces = data; this.loading = false; }, error: err => { this.error = 'Failed to load workspaces'; this.loading = false; } });
  }
}
