import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkspacesService } from '../services/workspaces.service';

@Component({
  selector: 'app-new-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-workspace.component.html',
  styleUrl: './new-workspace.component.css'
})
export class NewWorkspaceComponent {
  name = '';
  description = '';
  isSubmitting = false;
  error = '';

  constructor(private readonly ws: WorkspacesService, private readonly router: Router) {}

  onSubmit(form: NgForm) {
    if (form.invalid) { form.form.markAllAsTouched(); return; }
    this.isSubmitting = true; this.error = '';
    this.ws.create({ name: this.name, description: this.description }).subscribe({ next: () => { this.router.navigate(['/workspaces']); }, error: () => { this.error = 'Failed to create workspace'; this.isSubmitting = false; } });
  }
}
