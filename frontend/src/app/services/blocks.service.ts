import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface BlockDto {
  id: number;
  pageId: number;
  type: string;
  content?: string | null;
  sortOrder: number;
  parentBlockId?: number | null;
}

export interface CreateBlockRequest {
  pageId: number;
  type: string;
  content?: string | null;
  sortOrder?: number;
  parentBlockId?: number | null;
}

export interface UpdateBlockRequest {
  type?: string | null;
  content?: string | null;
  sortOrder?: number | null;
}

@Injectable({ providedIn: 'root' })
export class BlocksService {
  private readonly base = 'http://localhost:5000/api/v1';

  constructor(private readonly http: HttpClient) {}

  listByPage(pageId: number): Observable<BlockDto[]> {
    return this.http.get<ApiResponse<BlockDto[]>>(`${this.base}/pages/${pageId}/blocks`).pipe(map(unwrapApiResponse));
  }

  create(pageId: number, req: CreateBlockRequest): Observable<BlockDto> {
    return this.http.post<ApiResponse<BlockDto>>(`${this.base}/pages/${pageId}/blocks`, req).pipe(map(unwrapApiResponse));
  }

  update(id: number, req: UpdateBlockRequest): Observable<BlockDto> {
    return this.http.put<ApiResponse<BlockDto>>(`${this.base}/blocks/${id}`, req).pipe(map(unwrapApiResponse));
  }

  delete(id: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.base}/blocks/${id}`).pipe(map(unwrapApiResponse));
  }
}
