import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export interface PageResponse {
  id: number;
  workspaceId: number;
  parentPageId: number | null;
  createdByUserId: number;
  title: string;
  slug: string;
  content: string | null;
  plainText: string | null;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePageRequest {
  workspaceId: number;
  title: string;
  content?: string;
  parentPageId?: number;
}

export interface UpdatePageRequest {
  title: string;
  content?: string;
}

@Injectable({ providedIn: 'root' })
export class PageService {
  private apiUrl = `${environment.apiUrl}/pages`;

  constructor(private http: HttpClient) {}

  getPages(workspaceId: number): Observable<PageResponse[]> {
    return this.http.get<PageResponse[]>(`${this.apiUrl}?workspaceId=${workspaceId}`);
  }

  getPage(id: number): Observable<PageResponse> {
    return this.http.get<PageResponse>(`${this.apiUrl}/${id}`);
  }

  createPage(request: CreatePageRequest): Observable<PageResponse> {
    return this.http.post<PageResponse>(this.apiUrl, request);
  }

  updatePage(id: number, request: UpdatePageRequest): Observable<PageResponse> {
    return this.http.put<PageResponse>(`${this.apiUrl}/${id}`, request);
  }

  deletePage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
