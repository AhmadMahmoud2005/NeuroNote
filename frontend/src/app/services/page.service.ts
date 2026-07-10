import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export interface PageResponse {
  id: number;
  workspaceId: number;
  workspaceName: string;
  parentPageId: number | null;
  createdByUserId: number;
  createdByUsername: string;
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

export interface SharedUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  permission: string;
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

  getSharedPages(): Observable<PageResponse[]> {
    return this.http.get<PageResponse[]>(`${this.apiUrl}/shared`);
  }

  sharePage(id: number, usernameOrEmail: string, permission: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/share`, {
      usernameOrEmail,
      permission
    });
  }

  getSharedUsers(id: number): Observable<SharedUser[]> {
    return this.http.get<SharedUser[]>(`${this.apiUrl}/${id}/shared-users`);
  }

  revokePageShare(id: number, sharedUserId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/share/${sharedUserId}`);
  }

  getPageInvitations(): Observable<PageInvitation[]> {
    return this.http.get<PageInvitation[]>(`${this.apiUrl}/invitations`);
  }

  respondToPageInvitation(invitationId: number, accept: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/invitations/${invitationId}/respond`, {
      accept
    });
  }

  getAllPages(): Observable<PageResponse[]> {
    return this.http.get<PageResponse[]>(`${this.apiUrl}/all`);
  }

  uploadImage(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/upload-image`, formData);
  }
}

export interface PageInvitation {
  id: number;
  pageId: number;
  pageTitle: string;
  sharedByUsername: string;
  permission: string;
  sharedAt: string;
}
