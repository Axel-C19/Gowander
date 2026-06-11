import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/slices/auth.slice';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import type { RootStackParamList } from '../types/navigation';

const Root = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isLoading = useAuthStore((s) => s.isLoading);
    const setLoading = useAuthStore((s) => s.setLoading);

    // Resolve the loading state on mount.
    // In the future this is where you'd check SecureStore for a saved token.
    useEffect(() => {
        setLoading(false);
    }, []);

    // Still checking auth state — render nothing (splash stays visible)
    if (isLoading) return null;

    return (
        <NavigationContainer>
            <Root.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <Root.Screen name="App" component={AppStack} />
                ) : (
                    <Root.Screen name="Auth" component={AuthStack} />
                )}
            </Root.Navigator>
        </NavigationContainer>
    );
}