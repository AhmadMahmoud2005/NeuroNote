import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { WorkspaceTopbarComponent } from '../workspace-topbar/workspace-topbar.component';
import { SearchNote, SearchResults, SearchService } from '../services/search.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, SlideBarComponent, WorkspaceTopbarComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  activeWorkspaceId = 1;
  query = '';
  isLoading = false;
  recentSearches: string[] = [];
  results: SearchResults = { notes: [], tasks: [], files: [] };

  private readonly queryChanges = new Subject<string>();
  private querySubscription?: Subscription;

  constructor(
    private readonly searchService: SearchService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.activeWorkspaceId = Number(localStorage.getItem('activeWorkspaceId')) || 1;
    this.recentSearches = this.loadRecentSearches();
    this.querySubscription = this.queryChanges
      .pipe(
        debounceTime(260),
        distinctUntilChanged(),
        tap(() => (this.isLoading = true)),
        switchMap(query => this.searchService.search(query, this.activeWorkspaceId))
      )
      .subscribe(results => {
        this.results = results;
        this.isLoading = false;
      });

    this.queryChanges.next('');
  }

  ngOnDestroy(): void {
    this.querySubscription?.unsubscribe();
  }

  get pendingTasksCount(): number {
    return this.results.tasks.filter(task => task.isPending).length;
  }

  onQueryChange(value: string): void {
    this.query = value;
    this.queryChanges.next(value);
  }

  submitSearch(): void {
    const trimmedQuery = this.query.trim();

    if (!trimmedQuery) {
      return;
    }

    this.recentSearches = [
      trimmedQuery,
      ...this.recentSearches.filter(search => search.toLowerCase() !== trimmedQuery.toLowerCase())
    ].slice(0, 5);
    localStorage.setItem(this.recentKey, JSON.stringify(this.recentSearches));
    this.queryChanges.next(trimmedQuery);
  }

  useRecentSearch(search: string): void {
    this.query = search;
    this.queryChanges.next(search);
  }

  openNote(note: SearchNote): void {
    this.router.navigate(['/pages', note.id]);
  }

  openTask(): void {
    this.router.navigate(['/tasks']);
  }

  highlight(value: string): string {
    const trimmedQuery = this.query.trim();

    if (!trimmedQuery) {
      return value;
    }

    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return value.replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark>$1</mark>');
  }

  @HostListener('document:keydown', ['$event'])
  focusSearch(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const isTyping = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;

    if (event.key === '/' && !isTyping) {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  }

  private get recentKey(): string {
    return `recentSearches-${this.activeWorkspaceId}`;
  }

  private loadRecentSearches(): string[] {
    const storedSearches = localStorage.getItem(this.recentKey);

    if (storedSearches) {
      try {
        const parsedSearches = JSON.parse(storedSearches) as string[];

        if (Array.isArray(parsedSearches)) {
          return parsedSearches;
        }
      } catch {
        localStorage.removeItem(this.recentKey);
      }
    }

    return [];
  }
}
