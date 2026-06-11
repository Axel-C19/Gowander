import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 5 * 60 * 1000,
        },
        mutations: {
            retry: 0,
        },
    },
});

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <StatusBar style="dark" />
                <RootNavigator />
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}