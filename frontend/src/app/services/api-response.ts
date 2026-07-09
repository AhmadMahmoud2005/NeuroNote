export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  return response.data;
}
