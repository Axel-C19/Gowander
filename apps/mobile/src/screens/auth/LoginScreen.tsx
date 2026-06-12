import React, { useState } from 'react';
import {
    Image,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { showAlert } from '../../components/ui/AppDialog';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { ENDPOINTS } from '@gowander/shared-constants';
import { useLogin, useTokenLogin } from '../../hooks/useAuth';
import { BASE_URL } from '../../services/api';
import type { AuthScreenNavigationProp } from '../../types/navigation';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, type ThemeColors } from '../../constants';
import { Button } from '../../components/ui/Button';
import { useThemeColors } from '../../hooks/useTheme';

// Finish any pending OAuth redirect when the app regains focus
WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

    const navigation = useNavigation<AuthScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const login = useLogin();
    const googleLogin = useTokenLogin();

    // Server-side OAuth: the backend talks to Google (Expo Go's exp://
    // redirect is rejected by Google), then deep-links back with our JWT.
    async function handleGoogleLogin() {
        const returnUrl = Linking.createURL('google-auth');
        const startUrl =
            `${BASE_URL}${ENDPOINTS.AUTH.GOOGLE_START}` +
            `?return_url=${encodeURIComponent(returnUrl)}`;

        const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
        if (result.type !== 'success' || !result.url) return; // user cancelled

        const { queryParams } = Linking.parse(result.url);
        const token = typeof queryParams?.token === 'string' ? queryParams.token : null;
        const error = typeof queryParams?.error === 'string' ? queryParams.error : null;

        if (!token) {
            if (error && error !== 'access_denied' && error !== 'cancelled') {
                showAlert('Google sign-in failed', error);
            }
            return;
        }
        try {
            await googleLogin.mutateAsync(token);
        } catch (err) {
            showAlert(
                'Google sign-in failed',
                err instanceof Error ? err.message : 'Please try again.',
            );
        }
    }

    async function handleLogin() {
        if (!email.trim() || !password.trim()) {
            showAlert('Missing fields', 'Please enter your email and password.');
            return;
        }
        try {
            await login.mutateAsync({ email: email.trim().toLowerCase(), password });
        } catch (err) {
            showAlert('Login failed', err instanceof Error ? err.message : 'Unknown error');
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>
                <Image
                    source={require('../../../assets/logo-mark.png')}
                    style={styles.logoMark}
                    resizeMode="contain"
                />
                <Text style={styles.logo}>
                    <Text style={styles.logoAccent}>go</Text>wander
                </Text>
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

                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleLogin}
                        disabled={login.isPending || googleLogin.isPending}
                        activeOpacity={0.8}
                    >
                        {googleLogin.isPending ? (
                            <ActivityIndicator color={COLORS.text} />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={18} color={COLORS.text} />
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

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

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
    },
    logoMark: {
        width: 88,
        height: 88,
        alignSelf: 'center',
        marginBottom: SPACING.sm,
    },
    logo: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.hero,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    logoAccent: {
        fontFamily: FONTS.heavy,
        color: COLORS.primary,
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
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    dividerLine: {
        flex: 1,
        height: 1.5,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        height: 52,
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderBottomWidth: 4,
        borderBottomColor: COLORS.borderDark,
        borderRadius: BORDER_RADIUS.lg,
    },
    googleButtonText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
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
