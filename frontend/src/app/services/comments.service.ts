import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface CommentDto {
  id: number;
  userId: number;
  pageId: number;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateCommentRequest {
  content: string;
}

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly base = 'http://localhost:5000/api/v1';

  constructor(private readonly http: HttpClient) {}

  listByPage(pageId: number): Observable<CommentDto[]> {
    return this.http.get<ApiResponse<CommentDto[]>>(`${this.base}/pages/${pageId}/comments`).pipe(map(unwrapApiResponse));
  }

  create(pageId: number, request: CreateCommentRequest): Observable<CommentDto> {
    return this.http.post<ApiResponse<CommentDto>>(`${this.base}/pages/${pageId}/comments`, request).pipe(map(unwrapApiResponse));
  }

  update(id: number, request: CreateCommentRequest): Observable<CommentDto> {
    return this.http.put<ApiResponse<CommentDto>>(`${this.base}/comments/${id}`, request).pipe(map(unwrapApiResponse));
  }

  delete(id: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.base}/comments/${id}`).pipe(map(unwrapApiResponse));
  }
}
