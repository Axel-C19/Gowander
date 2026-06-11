import { ENDPOINTS } from '@gowander/shared-constants';
import type { LoginRequest, AuthResponse, UserProfile } from '@gowander/shared-types';
import { apiClient, tokenStorage } from './api';

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
}

export const authService = {
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>(
            ENDPOINTS.AUTH.LOGIN,
            credentials,
        );
        await tokenStorage.save(data.access_token);
        return data;
    },

    async register(payload: RegisterRequest): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>(
            ENDPOINTS.AUTH.REGISTER,
            payload,
        );
        await tokenStorage.save(data.access_token);
        return data;
    },

    async me(): Promise<UserProfile> {
        const { data } = await apiClient.get<UserProfile>(ENDPOINTS.AUTH.ME);
        return data;
    },

    async updatePreferences(preferences: string[]): Promise<UserProfile> {
        const { data } = await apiClient.put<UserProfile>(
            ENDPOINTS.AUTH.PREFERENCES,
            { preferences },
        );
        return data;
    },

    async logout(): Promise<void> {
        await tokenStorage.remove();
    },
};