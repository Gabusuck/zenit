
import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';

export default function RegisterScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { register } = useUser();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !username || !email || !password || !confirmPassword) {
            Alert.alert('Erro', 'Por favor preencha todos os campos.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As palavras-passe não coincidem.');
            return;
        }

        setLoading(true);
        // Trim inputs
        const { error } = await register(name.trim(), username.trim(), email.trim(), password);
        setLoading(false);

        if (error) {
            Alert.alert('Erro no Registo', error.message);
        } else {
            // Registration successful (and user is signed out by context)
            Alert.alert('Sucesso', 'Conta criada com sucesso! Por favor, faça login.');

            // Force navigation to login immediately
            router.replace('/login');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="dark" />
            <Stack.Screen options={{
                title: 'Registar',
                headerStyle: { backgroundColor: '#fff' },
                headerShadowVisible: false,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <FontAwesome5 name="arrow-left" size={20} color="#333" />
                    </TouchableOpacity>
                ),
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Cria a tua conta</Text>
                    <Text style={styles.subtitle}>Junta-te à comunidade Zenit!</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <FontAwesome5 name="user" size={18} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome Completo"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <FontAwesome5 name="at" size={18} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome de Utilizador (@)"
                            placeholderTextColor="#999"
                            value={username}
                            onChangeText={(text) => {
                                // Ensure it starts with @ if user types anything
                                if (text.length > 0 && !text.startsWith('@')) {
                                    setUsername('@' + text);
                                } else {
                                    setUsername(text);
                                }
                            }}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <FontAwesome5 name="envelope" size={18} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <FontAwesome5 name="lock" size={18} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Palavra-passe"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <FontAwesome5 name="lock" size={18} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmar Palavra-passe"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: themeColors.primary }]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Criar Conta</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Já tens conta? </Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text style={[styles.linkText, { color: themeColors.primary }]}>Entrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
    },
    backButton: {
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 56,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    button: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        shadowColor: 'rgba(76, 175, 80, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    linkText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
});
