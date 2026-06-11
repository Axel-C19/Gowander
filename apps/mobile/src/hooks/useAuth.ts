import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@gowander/shared-constants';
import { authService, type RegisterRequest } from '../services/auth.service';
import { useAuthStore } from '../store/slices/auth.slice';
import type { LoginRequest } from '@gowander/shared-types';

export function useMe() {
    const setUser = useAuthStore((s) => s.setUser);
    const clearAuth = useAuthStore((s) => s.clearAuth);

    return useQuery({
        queryKey: QUERY_KEYS.ME,
        queryFn: authService.me,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
}

export function useLogin() {
    const setUser = useAuthStore((s) => s.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: LoginRequest) => authService.login(credentials),
        onSuccess: (response) => {
            setUser(response.user);
            queryClient.setQueryData(QUERY_KEYS.ME, response.user);
        },
    });
}

export function useRegister() {
    const setUser = useAuthStore((s) => s.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: RegisterRequest) => authService.register(payload),
        onSuccess: (response) => {
            setUser(response.user);
            queryClient.setQueryData(QUERY_KEYS.ME, response.user);
        },
    });
}

export function useUpdatePreferences() {
    const setUser = useAuthStore((s) => s.setUser);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (preferences: string[]) =>
            authService.updatePreferences(preferences),
        onSuccess: (user) => {
            setUser(user);
            queryClient.setQueryData(QUERY_KEYS.ME, user);
        },
    });
}

export function useLogout() {
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authService.logout,
        onSuccess: () => {
            clearAuth();
            queryClient.clear();
        },
    });
}