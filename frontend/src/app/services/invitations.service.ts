import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface NotificationDto {
  id: number;
  type: string;
  message: string;
  workspaceId: number;
  workspaceName: string;
  token: string;
  createdAt: string;
}

export interface InvitationDto {
  id: number;
  workspaceId: number;
  workspaceName: string;
  email: string;
  invitedByUserId: number;
  invitedByName: string;
  memberRole: string;
  token: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationRequest {
  email: string;
  memberRole: string;
}

@Injectable({ providedIn: 'root' })
export class InvitationsService {
  private readonly base = 'http://localhost:5000/api/v1';

  constructor(private readonly http: HttpClient) {}

  getNotifications(): Observable<NotificationDto[]> {
    return this.http.get<ApiResponse<NotificationDto[]>>(`${this.base}/notifications`).pipe(
      map(unwrapApiResponse)
    );
  }

  accept(token: string): Observable<InvitationDto> {
    return this.http.post<ApiResponse<InvitationDto>>(`${this.base}/invitations/${token}/accept`, {}).pipe(
      map(unwrapApiResponse)
    );
  }

  decline(token: string): Observable<InvitationDto> {
    return this.http.post<ApiResponse<InvitationDto>>(`${this.base}/invitations/${token}/decline`, {}).pipe(
      map(unwrapApiResponse)
    );
  }

  invite(workspaceId: number, req: CreateInvitationRequest): Observable<InvitationDto> {
    return this.http.post<ApiResponse<InvitationDto>>(`${this.base}/workspaces/${workspaceId}/invitations`, req).pipe(
      map(unwrapApiResponse)
    );
  }
}
