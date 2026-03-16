export interface JwtPayload {
    sub: string;
    email: string;
    iss: string;
    aud: string;
    iat?: number;
    exp?: number;
}

export interface JwtRefreshPayload {
    sub: string;
    type: 'refresh';
    iss: string;
    aud: string;
    iat?: number;
    exp?: number;
}

export interface RefreshTokenValidationResult {
    id: string;
    refreshToken: string | undefined;
}
