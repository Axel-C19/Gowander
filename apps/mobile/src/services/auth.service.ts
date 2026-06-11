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

    async updateProfile(payload: { full_name?: string; bio?: string }): Promise<UserProfile> {
        const { data } = await apiClient.put<UserProfile>(ENDPOINTS.AUTH.PROFILE, payload);
        return data;
    },

    async uploadAvatar(image: { uri: string; mimeType: string }): Promise<UserProfile> {
        const form = new FormData();
        const ext = image.mimeType.split('/')[1] ?? 'jpg';
        form.append('file', {
            uri: image.uri,
            name: `avatar.${ext}`,
            type: image.mimeType,
        } as unknown as Blob);
        const { data } = await apiClient.post<UserProfile>(ENDPOINTS.AUTH.AVATAR, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    async googleLogin(idToken: string): Promise<AuthResponse> {
        const { data } = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.GOOGLE, {
            id_token: idToken,
        });
        await tokenStorage.save(data.access_token);
        return data;
    },

    /** Finish the server-side Google flow: store our JWT, fetch the user. */
    async loginWithToken(token: string): Promise<UserProfile> {
        await tokenStorage.save(token);
        const { data } = await apiClient.get<UserProfile>(ENDPOINTS.AUTH.ME);
        return data;
    },

    async logout(): Promise<void> {
        await tokenStorage.remove();
    },
};