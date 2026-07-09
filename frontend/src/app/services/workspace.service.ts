import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export interface WorkspaceResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  ownerUserId: number;
  createdAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private apiUrl = `${environment.apiUrl}/workspaces`;

  constructor(private http: HttpClient) {}

  getWorkspaces(): Observable<WorkspaceResponse[]> {
    return this.http.get<WorkspaceResponse[]>(this.apiUrl);
  }

  createWorkspace(request: CreateWorkspaceRequest): Observable<WorkspaceResponse> {
    return this.http.post<WorkspaceResponse>(this.apiUrl, request);
  }
}
