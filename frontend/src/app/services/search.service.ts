import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, delay, map, of } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface SearchNote {
  id: number;
  title: string;
  excerpt: string;
  updatedAt: string;
  tags: string[];
}

export interface SearchTask {
  id: number;
  title: string;
  dueLabel: string;
  isPending: boolean;
}

export interface SearchFile {
  id: number;
  name: string;
  meta: string;
  type: 'image' | 'pdf' | 'doc';
}

export interface SearchResults {
  notes: SearchNote[];
  tasks: SearchTask[];
  files: SearchFile[];
}

interface ApiSearchResult {
  pages: Array<{
    id: number;
    title: string;
    slug: string;
    updatedAt?: string | null;
    createdAt: string;
  }>;
  blocks: Array<{
    id: number;
    pageId: number;
    pageTitle: string;
    type: string;
    content?: string | null;
  }>;
}

interface StoredTask {
  id: number;
  workspaceId: number;
  title: string;
  priority: string;
  dueDate: string;
  isCompleted: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/search';

  constructor(private readonly http: HttpClient) {}

  search(query: string, workspaceId: number): Observable<SearchResults> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return of(this.getEmptyResults()).pipe(delay(80));
    }

    const params = new HttpParams()
      .set('query', normalizedQuery)
      .set('workspaceId', workspaceId);

    return this.http.get<ApiResponse<ApiSearchResult>>(this.apiUrl, { params }).pipe(
      map(unwrapApiResponse),
      map(result => this.mergeLocalTasks(this.mapApiResults(result), normalizedQuery, workspaceId)),
      catchError(() => this.searchLocal(normalizedQuery, workspaceId))
    );
  }

  private mapApiResults(result: ApiSearchResult): SearchResults {
    const pageNotes = result.pages.map(page => ({
      id: page.id,
      title: page.title,
      excerpt: `/${page.slug}`,
      updatedAt: this.formatDate(page.updatedAt ?? page.createdAt),
      tags: ['Page']
    }));

    const blockNotes = result.blocks.map(block => ({
      id: block.pageId,
      title: block.pageTitle,
      excerpt: this.stripHtml(block.content ?? ''),
      updatedAt: 'Matched block',
      tags: [block.type]
    }));

    return {
      notes: [...pageNotes, ...blockNotes],
      tasks: [],
      files: []
    };
  }

  private searchLocal(query: string, workspaceId: number): Observable<SearchResults> {
    const normalizedQuery = query.toLowerCase();
    const matches = (value: string): boolean => value.toLowerCase().includes(normalizedQuery);
    const notes: SearchNote[] = [];

    return of({
      notes,
      tasks: this.getWorkspaceTasks(workspaceId).filter(task => matches(task.title) || matches(task.dueLabel)),
      files: []
    }).pipe(delay(120));
  }

  private mergeLocalTasks(results: SearchResults, query: string, workspaceId: number): SearchResults {
    const normalizedQuery = query.toLowerCase();
    const matches = (value: string): boolean => value.toLowerCase().includes(normalizedQuery);
    const tasks = this.getWorkspaceTasks(workspaceId).filter(task => matches(task.title) || matches(task.dueLabel));

    return {
      ...results,
      tasks
    };
  }

  private getWorkspaceTasks(workspaceId: number): SearchTask[] {
    const storedTasks = localStorage.getItem('tasks');

    if (!storedTasks) {
      return [];
    }

    try {
      const parsedTasks = JSON.parse(storedTasks) as StoredTask[];

      if (!Array.isArray(parsedTasks)) {
        return [];
      }

      return parsedTasks
        .filter(task => task.workspaceId === workspaceId)
        .map(task => ({
          id: task.id,
          title: task.title,
          dueLabel: task.dueDate ? `Due ${task.dueDate}` : (task.isCompleted ? 'Done' : 'No due date'),
          isPending: !task.isCompleted
        }));
    } catch {
      return [];
    }
  }

  private getEmptyResults(): SearchResults {
    return { notes: [], tasks: [], files: [] };
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Recently updated' : date.toLocaleDateString();
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
