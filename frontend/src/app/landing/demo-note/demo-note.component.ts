import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-demo-note',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './demo-note.component.html',
  styleUrl: './demo-note.component.css'
})
export class DemoNoteComponent {
  title = 'Untitled Note';
  content = '';
  showSaveModal = false;

  constructor(private readonly router: Router) {}

  onContentInput(event: Event): void {
    const el = event.target as HTMLElement;
    this.content = el.innerHTML;
  }

  savePage(): void {
    this.showSaveModal = true;
  }

  confirmLogin(): void {
    this.showSaveModal = false;
    this.router.navigate(['/login']);
  }

  cancelModal(): void {
    this.showSaveModal = false;
  }
}
