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