export interface LoginRequest {
    email: string;
    password: string;
    rememberMe: boolean;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
}

export interface AntiforgeryResponse {
    token: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface ValidationProblemDetails {
  title?: string;
  status?: number;
  traceId?: string;
  errors?: Record<string, string[]>;
}