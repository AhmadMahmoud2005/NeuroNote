import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export interface SearchNote {
  id: number;
  title: string;
  excerpt: string;
  updatedAt: string;
  workspaceName: string;
}

export interface SearchTask {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  dueDate: string | null;
}

export interface SearchWorkspace {
  id: number;
  name: string;
  description: string;
  ownerUsername: string;
}

export interface SearchResults {
  notes: SearchNote[];
  tasks: SearchTask[];
  workspaces: SearchWorkspace[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private apiUrl = `${environment.apiUrl}/search`;

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(`${this.apiUrl}?query=${encodeURIComponent(query)}`);
  }
}
