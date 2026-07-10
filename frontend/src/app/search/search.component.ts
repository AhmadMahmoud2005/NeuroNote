import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { SearchNote, SearchResults, SearchService, SearchWorkspace } from '../services/search.service';
import { WorkspaceResponse, WorkspaceService } from '../services/workspace.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, SlideBarComponent, RouterLink],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  query = '';
  isLoading = false;
  recentSearches: string[] = [];
  results: SearchResults = { notes: [], tasks: [], workspaces: [] };
  workspaces: WorkspaceResponse[] = [];
  selectedWorkspaceId: number | null = null;

  // Pagination state
  notesPage = 1;
  notesPerPage = 5;
  workspacesPage = 1;
  workspacesPerPage = 4;

  private readonly queryChanges = new Subject<{ q: string; wsId: number | null }>();
  private querySubscription?: Subscription;

  constructor(
    private readonly searchService: SearchService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly workspaceService: WorkspaceService
  ) {}

  ngOnInit(): void {
    this.recentSearches = this.loadRecentSearches();

    // Fetch workspaces for the filter dropdown
    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces = workspaces;
      },
      error: (err) => console.error('Error loading workspaces for filter:', err)
    });

    this.querySubscription = this.queryChanges
      .pipe(
        debounceTime(260),
        distinctUntilChanged((prev, curr) => prev.q === curr.q && prev.wsId === curr.wsId),
        tap(() => {
          this.isLoading = true;
          this.notesPage = 1;
          this.workspacesPage = 1;
        }),
        switchMap(change => this.searchService.search(change.q, change.wsId))
      )
      .subscribe({
        next: (results) => {
          this.results = results;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Search error:', err);
          this.isLoading = false;
        }
      });

    // Check query params for initial query 'q' and 'workspaceId'
    this.route.queryParams.subscribe(params => {
      const qParam = params['q'] || '';
      const wsParam = params['workspaceId'] ? parseInt(params['workspaceId']) : null;
      this.query = qParam;
      this.selectedWorkspaceId = wsParam;
      this.queryChanges.next({ q: qParam, wsId: wsParam });
    });
  }

  ngOnDestroy(): void {
    this.querySubscription?.unsubscribe();
  }

  onQueryChange(value: string): void {
    this.query = value;
    this.queryChanges.next({ q: value, wsId: this.selectedWorkspaceId });
  }

  onFilterChange(): void {
    this.submitSearch();
  }

  submitSearch(): void {
    const trimmedQuery = this.query.trim();
    if (!trimmedQuery) return;

    // Update recent searches
    this.recentSearches = [
      trimmedQuery,
      ...this.recentSearches.filter(search => search.toLowerCase() !== trimmedQuery.toLowerCase())
    ].slice(0, 5);
    localStorage.setItem(this.recentKey, JSON.stringify(this.recentSearches));

    // Update URL (without reloading)
    const queryParams: any = { q: trimmedQuery };
    if (this.selectedWorkspaceId) {
      queryParams.workspaceId = this.selectedWorkspaceId;
    }
    this.router.navigate(['/search'], { queryParams });

    // Directly execute the search — don't rely on route param subscription
    // because distinctUntilChanged suppresses re-emits when URL is unchanged
    this.isLoading = true;
    this.notesPage = 1;
    this.workspacesPage = 1;
    this.searchService.search(trimmedQuery, this.selectedWorkspaceId).subscribe({
      next: (results) => {
        this.results = results;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isLoading = false;
      }
    });
  }

  useRecentSearch(search: string): void {
    this.query = search;
    this.submitSearch();
  }

  highlight(value: string): string {
    const trimmedQuery = this.query.trim();
    if (!trimmedQuery) return value;

    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return value.replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark>$1</mark>');
  }

  getOpenTasksCount(): number {
    return this.results.tasks.filter(t => !t.isCompleted).length;
  }

  formatDateOnly(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Pagination getters
  get paginatedNotes(): SearchNote[] {
    const startIndex = (this.notesPage - 1) * this.notesPerPage;
    return this.results.notes.slice(startIndex, startIndex + this.notesPerPage);
  }

  get paginatedWorkspaces(): SearchWorkspace[] {
    const startIndex = (this.workspacesPage - 1) * this.workspacesPerPage;
    return this.results.workspaces.slice(startIndex, startIndex + this.workspacesPerPage);
  }

  get notesPageCount(): number {
    return Math.ceil(this.results.notes.length / this.notesPerPage);
  }

  get workspacesPageCount(): number {
    return Math.ceil(this.results.workspaces.length / this.workspacesPerPage);
  }

  get notesPageNumbers(): number[] {
    return Array.from({ length: this.notesPageCount }, (_, i) => i + 1);
  }

  get workspacesPageNumbers(): number[] {
    return Array.from({ length: this.workspacesPageCount }, (_, i) => i + 1);
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
    return 'recentSearches-global';
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
    const defaults = ['Planning', 'Missions', 'Workspaces'];
    localStorage.setItem(this.recentKey, JSON.stringify(defaults));
    return defaults;
  }
}
