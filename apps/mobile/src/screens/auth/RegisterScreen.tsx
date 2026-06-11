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
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRegister } from '../../hooks/useAuth';
import type { AuthScreenNavigationProp } from '../../types/navigation';
import { COLORS, FONTS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';
import { Button } from '../../components/ui/Button';

export function RegisterScreen() {
    const navigation = useNavigation<AuthScreenNavigationProp>();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const register = useRegister();

    async function handleRegister() {
        if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
            Alert.alert('Missing fields', 'Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password mismatch', 'Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            Alert.alert('Weak password', 'Password must be at least 8 characters.');
            return;
        }
        try {
            await register.mutateAsync({
                email: email.trim().toLowerCase(),
                password,
                full_name: fullName.trim(),
            });
        } catch (err) {
            Alert.alert(
                'Registration failed',
                err instanceof Error ? err.message : 'Unknown error',
            );
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.inner}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.logo}>GoWander</Text>
                <Text style={styles.tagline}>Create your account</Text>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Full name"
                        placeholderTextColor={COLORS.textMuted}
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        autoComplete="name"
                        returnKeyType="next"
                        editable={!register.isPending}
                    />
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
                        editable={!register.isPending}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password (min. 8 characters)"
                        placeholderTextColor={COLORS.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        returnKeyType="next"
                        editable={!register.isPending}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm password"
                        placeholderTextColor={COLORS.textMuted}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={handleRegister}
                        editable={!register.isPending}
                    />

                    <Button
                        title={register.isPending ? 'Creating...' : 'Create account'}
                        onPress={handleRegister}
                        disabled={register.isPending}
                        style={{ marginTop: SPACING.sm }}
                    />

                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => navigation.navigate('Login')}
                        disabled={register.isPending}
                    >
                        <Text style={styles.loginLinkText}>
                            Already have an account?{' '}
                            <Text style={styles.loginLinkBold}>Sign in</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    inner: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xxl,
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
    loginLink: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    loginLinkText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
    },
    loginLinkBold: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});