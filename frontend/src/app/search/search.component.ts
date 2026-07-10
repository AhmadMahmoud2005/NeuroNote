import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { SlideBarComponent } from '../slide-bar/slide-bar.component';
import { SearchResults, SearchService } from '../services/search.service';

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

  private readonly queryChanges = new Subject<string>();
  private querySubscription?: Subscription;

  constructor(
    private readonly searchService: SearchService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.recentSearches = this.loadRecentSearches();
    this.querySubscription = this.queryChanges
      .pipe(
        debounceTime(260),
        distinctUntilChanged(),
        tap(() => (this.isLoading = true)),
        switchMap(query => this.searchService.search(query))
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

    // Check query params for initial query 'q'
    this.route.queryParams.subscribe(params => {
      const qParam = params['q'] || '';
      if (qParam) {
        this.query = qParam;
        this.queryChanges.next(qParam);
      } else {
        this.queryChanges.next('');
      }
    });
  }

  ngOnDestroy(): void {
    this.querySubscription?.unsubscribe();
  }

  onQueryChange(value: string): void {
    this.query = value;
    this.queryChanges.next(value);
  }

  submitSearch(): void {
    const trimmedQuery = this.query.trim();
    if (!trimmedQuery) return;

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
