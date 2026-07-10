import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export interface TaskItem {
  id: number;
  workspaceId: number;
  title: string;
  description: string | null;
  priority: string; // Low, Medium, High
  complexity: string; // Easy, Medium, Hard
  dueDate: string | null;
  isCompleted: boolean;
  createdByUserId: number;
  createdByUsername: string;
  createdAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  priority: string;
  complexity: string;
  dueDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(workspaceId?: number): Observable<TaskItem[]> {
    const url = workspaceId ? `${this.apiUrl}?workspaceId=${workspaceId}` : this.apiUrl;
    return this.http.get<TaskItem[]>(url);
  }

  createTask(workspaceId: number | null, request: CreateTaskRequest): Observable<TaskItem> {
    const url = workspaceId ? `${this.apiUrl}?workspaceId=${workspaceId}` : this.apiUrl;
    return this.http.post<TaskItem>(url, request);
  }

  toggleTask(taskId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${taskId}/toggle`, {});
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}`);
  }
}
