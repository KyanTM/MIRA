export interface LoginRequest {
    email: string;
    password: string;
    rememberMe: boolean;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
}