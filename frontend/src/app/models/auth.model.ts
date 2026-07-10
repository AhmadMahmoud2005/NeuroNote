export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  defaultWorkspaceId: number;
}

export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}
