import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environment';
import { LoginRequest, RegisterRequest, AuthResponse, AuthUser } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get isLoggedIn(): boolean {
    return !!this.getToken();
  }

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.handleAuth(response))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.handleAuth(response))
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private handleAuth(response: AuthResponse): void {
    localStorage.setItem('auth_token', response.token);
    const user: AuthUser = {
      userId: response.userId,
      username: response.username,
      fullName: response.fullName,
      email: response.email
    };
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('activeWorkspaceId', String(response.defaultWorkspaceId));
    this.currentUserSubject.next(user);
  }

  private loadUser(): AuthUser | null {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  }
}
