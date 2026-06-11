import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLogin } from '../../hooks/useAuth';
import type { AuthScreenNavigationProp } from '../../types/navigation';
import { COLORS, FONTS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';
import { Button } from '../../components/ui/Button';

export function LoginScreen() {
    const navigation = useNavigation<AuthScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const login = useLogin();

    async function handleLogin() {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
            return;
        }
        try {
            await login.mutateAsync({ email: email.trim().toLowerCase(), password });
        } catch (err) {
            Alert.alert('Login failed', err instanceof Error ? err.message : 'Unknown error');
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>
                <Text style={styles.logo}>GoWander</Text>
                <Text style={styles.tagline}>Your intelligent travel companion</Text>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={COLORS.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        returnKeyType="next"
                        editable={!login.isPending}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={COLORS.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        editable={!login.isPending}
                    />

                    <Button
                        title={login.isPending ? 'Signing in...' : 'Sign in'}
                        onPress={handleLogin}
                        disabled={login.isPending}
                        style={{ marginTop: SPACING.sm }}
                    />

                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => navigation.navigate('Register')}
                        disabled={login.isPending}
                    >
                        <Text style={styles.registerLinkText}>
                            Don't have an account?{' '}
                            <Text style={styles.registerLinkBold}>Create one</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
    },
    logo: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.hero,
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    tagline: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: SPACING.xxl,
    },
    form: {
        gap: SPACING.md,
    },
    input: {
        height: 52,
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    button: {
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.sm,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: COLORS.surface,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    registerLink: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    registerLinkText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
    },
    registerLinkBold: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});