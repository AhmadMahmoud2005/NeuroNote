import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { PageService, PageResponse } from '../services/page.service';

@Component({
  selector: 'app-shared-notes',
  standalone: true,
  imports: [CommonModule, SlideBarComponent, RouterLink],
  templateUrl: './shared-notes.component.html',
  styleUrl: './shared-notes.component.css'
})
export class SharedNotesComponent implements OnInit {
  sharedPages: PageResponse[] = [];
  isLoading = true;

  constructor(private readonly pageService: PageService) {}

  ngOnInit(): void {
    this.loadSharedPages();
  }

  loadSharedPages(): void {
    this.isLoading = true;
    this.pageService.getSharedPages().subscribe({
      next: (pages) => {
        this.sharedPages = pages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading shared pages:', err);
        this.isLoading = false;
      }
    });
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
