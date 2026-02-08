
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, LayoutAnimation, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, UIManager, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

type AuthState = 'landing' | 'login' | 'register';

export default function AuthScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { login, register } = useUser();
    const [authState, setAuthState] = useState<AuthState>('landing');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const changeState = (newState: AuthState) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setAuthState(newState);
        setError('');
        setShowPassword(false);
        // Clear form fields
        setEmail('');
        setPassword('');
        setName('');
        setPhone('');
        setUsername('');
    };

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        // 'email' state variable here holds either email or username
        const { error } = await login(email, password);

        if (!error) {
            console.log('Login successful');
            router.replace('/home');
        } else {
            console.log('Login error:', error);
            setError('Dados incorretos.');
        }
    };

    const handleRegister = async () => {
        setError('');
        if (!name || !username || !email || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        if (password.length < 6) {
            setError('A palavra-passe deve ter pelo menos 6 caracteres.');
            return;
        }

        console.log('Register:', name, username, email);
        const { error } = await register(name, username, email, password);

        if (!error) {
            alert('Conta criada com sucesso! Por favor faça login.');
            changeState('login');
        } else {
            console.log('Register error:', error);
            setError(error.message || 'Erro ao registar.');
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            {authState !== 'landing' && (
                <TouchableOpacity onPress={() => changeState('landing')} style={styles.backButton}>
                    <FontAwesome5 name="chevron-left" size={24} color="#333" />
                </TouchableOpacity>
            )}
            <View style={styles.logoContainer}>
                <Text style={[styles.logoText, { color: themeColors.primary }]}>Zenit</Text>
                <Text style={styles.tagline}>Bem vindos ao Zenit</Text>
            </View>
        </View>
    );

    const renderLandingButtons = () => (
        <View style={styles.landingButtons}>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: themeColors.primary, flex: 1 }]}
                onPress={() => changeState('login')}
            >
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.outlineButton, { flex: 1 }]}
                onPress={() => changeState('register')}
            >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Registar</Text>
            </TouchableOpacity>
        </View>
    );

    const renderLoginForm = () => (
        <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Login</Text>

            {error ? <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{error}</Text> : null}

            <View style={styles.inputContainer}>
                <FontAwesome5 name="user" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={(text) => { setEmail(text); setError(''); }}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <FontAwesome5 name="lock" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => { setPassword(text); setError(''); }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <FontAwesome5 name={showPassword ? "eye-slash" : "eye"} size={18} color="#999" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.linkText, { color: themeColors.primary }]}>Esqueceu-se da palavra-passe?</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: themeColors.primary, marginTop: 10 }]}
                onPress={handleLogin}
            >
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
                <Text style={styles.footerText}>Ainda não tem uma conta? </Text>
                <TouchableOpacity onPress={() => changeState('register')}>
                    <Text style={[styles.linkText, { color: themeColors.primary }]}>Registar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderRegisterForm = () => (
        <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Registar</Text>

            {error ? <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{error}</Text> : null}

            <View style={styles.inputContainer}>
                <FontAwesome5 name="user" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Nome"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            <View style={styles.inputContainer}>
                <FontAwesome5 name="at" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Username (@exemplo)"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={(text) => {
                        const cleanText = text.replace(/\s/g, '');
                        if (cleanText.length > 0 && !cleanText.startsWith('@')) {
                            setUsername('@' + cleanText);
                        } else {
                            setUsername(cleanText);
                        }
                    }}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <FontAwesome5 name="lock" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <FontAwesome5 name={showPassword ? "eye-slash" : "eye"} size={18} color="#999" />
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <FontAwesome5 name="mobile-alt" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Telemóvel"
                    placeholderTextColor="#999"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
            </View>

            <View style={styles.inputContainer}>
                <FontAwesome5 name="envelope" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: themeColors.primary, marginTop: 10 }]}
                onPress={handleRegister}
            >
                <Text style={styles.buttonText}>Registar</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
                <Text style={styles.footerText}>Já tem uma conta? </Text>
                <TouchableOpacity onPress={() => changeState('login')}>
                    <Text style={[styles.linkText, { color: themeColors.primary }]}>Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: themeColors.primary }]}>
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Background Decoration */}
            <View style={styles.backgroundDecoration}>
                <Ionicons name="football" size={400} color="rgba(0,0,0,0.05)" style={{ transform: [{ rotate: '-20deg' }] }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, justifyContent: 'flex-end' }}
            >
                <View style={[
                    styles.bottomSheet,
                    authState === 'landing' ? styles.sheetLanding : styles.sheetExpanded
                ]}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {renderHeader()}

                        {authState === 'landing' && renderLandingButtons()}
                        {authState === 'login' && renderLoginForm()}
                        {authState === 'register' && renderRegisterForm()}

                        {authState === 'landing' && (
                            <View style={{ marginTop: 'auto', alignItems: 'center', paddingBottom: 0 }}>
                                <Text style={styles.footerText}>Made in Portugal 🇵🇹</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 200, // Move ball up
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 30,
        paddingTop: 40,
        width: '100%',
        overflow: 'hidden',
    },
    sheetLanding: {
        height: '40%', // Adjust based on content
        justifyContent: 'center',
    },
    sheetExpanded: {
        height: '85%', // Taller for forms
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
        width: '100%',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 10,
        padding: 5,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoText: {
        fontSize: 40,
        fontWeight: '900',
        marginBottom: 5,
    },
    tagline: {
        fontSize: 16,
        color: '#666',
    },
    landingButtons: {
        gap: 15,
        width: '100%',
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    formContainer: {
        width: '100%',
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F8E9', // Light Green Tint
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#C8E6C9', // Softer Green Border
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    forgotPassword: {
        alignItems: 'center',
        marginBottom: 20,
    },
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    outlineButton: {
        backgroundColor: '#388E3C', // Darker Green for contrast
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
        marginBottom: 30,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    linkText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    socialContainer: {
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: 20,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        marginBottom: 20,
    },
    googleButtonText: {
        color: '#1976D2',
        fontWeight: 'bold',
        fontSize: 14,
    },
    termsText: {
        color: '#999',
        fontSize: 12,
    },
});
