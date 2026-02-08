
import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

export default function GameDetailsScreen() {
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { user } = useUser();

    const [game, setGame] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGameDetails();
    }, [id]);

    const fetchGameDetails = async () => {
        if (!id) return;

        try {
            const { data, error } = await supabase
                .from('games')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching game details:', error);
            } else {
                setGame(data);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        );
    }

    if (!game) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Jogo não encontrado.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
            <Stack.Screen options={{
                title: 'Detalhes do Jogo',
                headerStyle: { backgroundColor: themeColors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }} />
            <StatusBar style="light" />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header Card */}
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.locationTitle}>{game.location}</Text>
                            <View style={styles.metaRow}>
                                <FontAwesome5 name="calendar-alt" size={14} color="#666" style={{ marginRight: 6 }} />
                                <Text style={styles.metaText}>{game.date} às {game.time.slice(0, 5)}</Text>
                            </View>
                        </View>
                        <View style={styles.priceTag}>
                            <Text style={styles.priceText}>{game.price}€</Text>
                        </View>
                    </View>
                </View>

                {/* Status / Slots */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Vagas</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(game.filled_slots / game.total_slots) * 100}%`, backgroundColor: themeColors.primary }]} />
                    </View>
                    <View style={styles.slotsRow}>
                        <Text style={styles.slotsText}>
                            <Text style={{ fontWeight: 'bold', color: themeColors.primary }}>{game.filled_slots}</Text>
                            /{game.total_slots} Confirmados
                        </Text>
                        {game.total_slots - game.filled_slots > 0 ? (
                            <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>{game.total_slots - game.filled_slots} vagas restantes</Text>
                        ) : (
                            <Text style={{ color: '#F44336', fontWeight: 'bold' }}>Esgotado</Text>
                        )}
                    </View>
                </View>

                {/* Description */}
                {game.description && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Detalhes</Text>
                        <Text style={styles.descriptionText}>{game.description}</Text>
                    </View>
                )}

                {/* Creator Info (Future: Fetch actual profile) */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Organizador</Text>
                    <View style={styles.organizerRow}>
                        <View style={styles.avatarPlaceholder}>
                            <FontAwesome5 name="user" size={20} color="#999" />
                        </View>
                        <View>
                            <Text style={styles.organizerName}>Organizador</Text>
                            <Text style={styles.organizerLabel}>Criador do jogo</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={[styles.joinButton, { backgroundColor: themeColors.primary }]}>
                    <Text style={styles.joinButtonText}>Juntar-me ao Jogo</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    locationTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 14,
        color: '#666',
    },
    priceTag: {
        backgroundColor: '#E8F5E9',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    priceText: {
        color: '#2E7D32',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#eee',
        borderRadius: 4,
        marginBottom: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    slotsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    slotsText: {
        fontSize: 14,
        color: '#666',
    },
    descriptionText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
    },
    organizerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    organizerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    organizerLabel: {
        fontSize: 13,
        color: '#999',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        paddingBottom: 30, // SafeArea
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 10,
    },
    joinButton: {
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
