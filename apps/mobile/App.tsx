import React from 'react';
import { Text, TextInput, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import {
    useFonts,
    Nunito_700Bold,
    Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { RootNavigator } from './src/navigation';
import { COLORS, FONTS, THEMES } from './src/constants';
import { useSettingsStore } from './src/store/slices/settings.slice';
import { useIsDark } from './src/hooks/useTheme';

// Make Nunito the default for every <Text>/<TextInput> without touching
// each StyleSheet. forwardRef components expose .render, so we wrap it.
function applyDefaultFont(Component: any) {
    const original = Component.render;
    if (!original) return;
    Component.render = function render(props: any, ref: any) {
        return original.call(this, {
            ...props,
            style: [{ fontFamily: FONTS.body }, props.style],
        }, ref);
    };
}
applyDefaultFont(Text);
applyDefaultFont(TextInput);

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

function ThemedApp() {
    const isDark = useIsDark();
    const palette = THEMES[isDark ? 'dark' : 'light'];
    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={palette.background} />
            <RootNavigator />
        </>
    );
}

export default function App() {
    const [fontsLoaded] = useFonts({
        Nunito_700Bold,
        Nunito_800ExtraBold,
    });
    const hydrated = useSettingsStore((s) => s.hydrated);
    const hydrate = useSettingsStore((s) => s.hydrate);

    React.useEffect(() => {
        hydrate();
    }, []);

    if (!fontsLoaded || !hydrated) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <ThemedApp />
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
