import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface PageDto {
  id: number;
  workspaceId: number;
  parentPageId?: number | null;
  createdByUserId: number;
  title: string;
  slug: string;
  metadataJson?: string | null;
  sortOrder: number;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreatePageRequest {
  workspaceId: number;
  parentPageId?: number | null;
  title: string;
  slug?: string | null;
}

export interface UpdatePageRequest {
  title: string;
  slug?: string | null;
  metadataJson?: string | null;
  isArchived: boolean;
}

@Injectable({ providedIn: 'root' })
export class PagesService {
  private readonly api = 'http://localhost:5000/api/v1/pages';

  constructor(private readonly http: HttpClient) {}

  get(id: number): Observable<PageDto> {
    return this.http.get<ApiResponse<PageDto>>(`${this.api}/${id}`).pipe(map(unwrapApiResponse));
  }

  listByWorkspace(workspaceId: number): Observable<PageDto[]> {
    return this.http.get<ApiResponse<PageDto[]>>(`${this.api}/by-workspace/${workspaceId}`).pipe(map(unwrapApiResponse));
  }

  create(req: CreatePageRequest): Observable<PageDto> {
    return this.http.post<ApiResponse<PageDto>>(this.api, req).pipe(map(unwrapApiResponse));
  }

  update(id: number, req: UpdatePageRequest): Observable<PageDto> {
    return this.http.put<ApiResponse<PageDto>>(`${this.api}/${id}`, req).pipe(map(unwrapApiResponse));
  }

  delete(id: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.api}/${id}`).pipe(map(unwrapApiResponse));
  }
}
