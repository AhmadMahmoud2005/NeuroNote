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
  ownerUsername: string;
  isShared: boolean;
  createdAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface WorkspaceInvitation {
  id: number;
  workspaceId: number;
  workspaceName: string;
  invitedByUsername: string;
  role: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private apiUrl = `${environment.apiUrl}/workspaces`;

  constructor(private http: HttpClient) {}

  getWorkspaces(): Observable<WorkspaceResponse[]> {
    return this.http.get<WorkspaceResponse[]>(this.apiUrl);
  }

  getWorkspace(id: number): Observable<WorkspaceResponse> {
    return this.http.get<WorkspaceResponse>(`${this.apiUrl}/${id}`);
  }

  createWorkspace(request: CreateWorkspaceRequest): Observable<WorkspaceResponse> {
    return this.http.post<WorkspaceResponse>(this.apiUrl, request);
  }

  updateWorkspace(id: number, request: CreateWorkspaceRequest): Observable<WorkspaceResponse> {
    return this.http.put<WorkspaceResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteWorkspace(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getInvitations(): Observable<WorkspaceInvitation[]> {
    return this.http.get<WorkspaceInvitation[]>(`${this.apiUrl}/invitations`);
  }

  inviteUser(workspaceId: number, usernameOrEmail: string, role: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${workspaceId}/invite`, {
      usernameOrEmail,
      role
    });
  }

  respondToInvitation(invitationId: number, accept: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/invitations/${invitationId}/respond`, {
      accept
    });
  }
}
