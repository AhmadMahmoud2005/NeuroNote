import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description?: string;
  ownerUserId: number;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspacesService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/workspaces';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Workspace[]> {
    return this.http.get<ApiResponse<Workspace[]>>(this.apiUrl).pipe(
      map(unwrapApiResponse),
      tap(workspaces => localStorage.setItem('workspaces', JSON.stringify(workspaces)))
    );
  }

  create(req: CreateWorkspaceRequest): Observable<Workspace> {
    return this.http.post<ApiResponse<Workspace>>(this.apiUrl, req).pipe(
      map(unwrapApiResponse),
      tap(workspace => {
        const stored = localStorage.getItem('workspaces');
        const workspaces = stored ? JSON.parse(stored) as Workspace[] : [];
        localStorage.setItem('workspaces', JSON.stringify([...workspaces.filter(item => item.id !== workspace.id), workspace]));
        localStorage.setItem('activeWorkspaceId', String(workspace.id));
      })
    );
  }
}
