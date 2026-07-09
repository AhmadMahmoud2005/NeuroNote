import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/auth';

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, request).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message ?? 'Login failed');
        }
        return unwrapApiResponse(response);
      }),
      tap(response => this.persistSession(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, request).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message ?? 'Registration failed');
        }
        return unwrapApiResponse(response);
      }),
      tap(response => this.persistSession(response))
    );
  }

  private persistSession(response: AuthResponse): void {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('userId', String(response.user.id));
    localStorage.setItem('authUser', JSON.stringify(response.user));
  }
}
