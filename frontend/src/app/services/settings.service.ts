import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  bio: string;
  avatarUrl: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  email: string;
  bio: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly apiUrl = 'http://localhost:5000/api/v1';
  private readonly profileKey = 'settingsProfile';

  constructor(private readonly http: HttpClient) {}

  getProfile(userId: number): Observable<UserProfile> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.apiUrl}/users/${userId}/profile`).pipe(
      map(unwrapApiResponse),
      tap(profile => this.saveLocalProfile(profile)),
      catchError(() => of(this.getLocalProfile(userId)))
    );
  }

  updateProfile(userId: number, request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<ApiResponse<UserProfile>>(`${this.apiUrl}/users/${userId}/profile`, request).pipe(
      map(unwrapApiResponse),
      tap(profile => this.saveLocalProfile(profile)),
      catchError(() => {
        const profile = { ...this.getLocalProfile(userId), ...request };
        this.saveLocalProfile(profile);
        return of(profile);
      })
    );
  }

  updateAvatar(userId: number, file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.post<ApiResponse<UserProfile>>(`${this.apiUrl}/users/${userId}/avatar`, formData).pipe(
      map(unwrapApiResponse),
      tap(profile => this.saveLocalProfile(profile)),
      catchError(() => this.readAvatarLocally(userId, file))
    );
  }

  private readAvatarLocally(userId: number, file: File): Observable<UserProfile> {
    return new Observable<UserProfile>(subscriber => {
      const reader = new FileReader();

      reader.onload = () => {
        const profile = { ...this.getLocalProfile(userId), avatarUrl: String(reader.result) };
        this.saveLocalProfile(profile);
        subscriber.next(profile);
        subscriber.complete();
      };

      reader.onerror = () => subscriber.error(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private getLocalProfile(userId: number): UserProfile {
    const storedProfile = localStorage.getItem(this.profileKey);

    if (storedProfile) {
      try {
        return JSON.parse(storedProfile) as UserProfile;
      } catch {
        localStorage.removeItem(this.profileKey);
      }
    }

    // If an auth session exists, use that user's name/email as sensible defaults.
    try {
      const authUserRaw = localStorage.getItem('authUser');
      if (authUserRaw) {
        const parsed = JSON.parse(authUserRaw);
        return {
          id: parsed.id ?? parsed.Id ?? userId,
          fullName: parsed.fullName ?? parsed.FullName ?? 'Your name',
          email: parsed.email ?? parsed.Email ?? '',
          bio: '',
          avatarUrl: ''
        };
      }
    } catch {
      // fall through to defaults
    }

    return {
      id: userId,
      fullName: 'Your name',
      email: '',
      bio: '',
      avatarUrl: ''
    };
  }

  private saveLocalProfile(profile: UserProfile): void {
    localStorage.setItem(this.profileKey, JSON.stringify(profile));
  }
}
