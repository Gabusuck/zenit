
import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
    const [players, setPlayers] = useState<any[]>([]);
    const [isJoined, setIsJoined] = useState(false);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchGameDetails();
        fetchPlayers();
    }, [id]);

    const fetchGameDetails = async () => {
        if (!id) return;

        try {
            const { data, error } = await supabase
                .from('games')
                .select('*, profiles:created_by(name, username, avatar_url)')
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

    const fetchPlayers = async () => {
        if (!id) return;

        try {
            // Fetch players and their profile info
            const { data, error } = await supabase
                .from('game_players')
                .select('user_id, status, profiles(name, username, avatar_url)')
                .eq('game_id', id);

            if (error) {
                console.error('Error fetching players:', error);
            } else {
                const formattedPlayers = data.map((item: any) => ({
                    ...item.profiles,
                    status: item.status
                }));
                setPlayers(formattedPlayers || []);

                // Check if current user is joined
                if (user) {
                    const isUserJoined = data.some((p: any) => p.user_id === user.id);
                    setIsJoined(isUserJoined);
                }
            }
        } catch (error) {
            console.error('Unexpected error fetching players:', error);
        }
    };

    const handleJoinGame = async () => {
        if (!user || !game) {
            if (!user) alert('Tens de fazer login primeiro.');
            return;
        }
        setJoining(true);

        try {
            if (isJoined) {
                // Leave Game
                const { error } = await supabase
                    .from('game_players')
                    .delete()
                    .eq('game_id', id)
                    .eq('user_id', user.id);

                if (error) throw error;
                setIsJoined(false);
                alert('Saíste do jogo.');
            } else {
                // Join Game
                if (game.filled_slots >= game.total_slots) {
                    alert('O jogo está cheio!');
                    return;
                }

                const { error } = await supabase
                    .from('game_players')
                    .insert({
                        game_id: id,
                        user_id: user.id,
                        status: 'confirmed'
                    });

                if (error) throw error;
                setIsJoined(true);
                alert('Estás inscrito! ⚽');
            }

            // Refresh data
            fetchGameDetails(); // To get updated slots
            fetchPlayers();

        } catch (error) {
            console.error('Error joining/leaving game:', error);
            alert('Erro ao atualizar inscrição: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        } finally {
            setJoining(false);
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
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                ),
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

                {/* Players List */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Jogadores ({players.length})</Text>
                    {players.length > 0 ? (
                        players.map((player, index) => (
                            <View key={index} style={styles.playerRow}>
                                <Image
                                    source={{ uri: player.avatar_url || 'https://via.placeholder.com/150' }}
                                    style={styles.playerAvatar}
                                />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.playerName}>{player.name || 'Jogador'}</Text>
                                    <Text style={styles.playerUsername}>{player.username || '@jogador'}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={{ color: '#999', fontStyle: 'italic' }}>Ainda ninguém se inscreveu. Sê o primeiro!</Text>
                    )}
                </View>

                {/* Description */}
                {game.description && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Detalhes</Text>
                        <Text style={styles.descriptionText}>{game.description}</Text>
                    </View>
                )}

                {/* Creator Info */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Organizador</Text>
                    <View style={styles.organizerRow}>
                        <Image
                            source={{ uri: game.profiles?.avatar_url || 'https://via.placeholder.com/150' }}
                            style={[styles.playerAvatar, { width: 50, height: 50, borderRadius: 25 }]}
                        />
                        <View style={{ marginLeft: 15 }}>
                            <Text style={styles.organizerName}>{game.profiles?.name || 'Organizador'}</Text>
                            <Text style={styles.organizerLabel}>@{game.profiles?.username || 'user'}</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.joinButton, { backgroundColor: isJoined ? '#F44336' : themeColors.primary, opacity: joining ? 0.7 : 1 }]}
                    onPress={handleJoinGame}
                    disabled={joining}
                >
                    {joining ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.joinButtonText}>
                            {isJoined ? 'Sair do Jogo' : 'Juntar-me ao Jogo'}
                        </Text>
                    )}
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
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    playerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eee',
    },
    playerName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    playerUsername: {
        fontSize: 12,
        color: '#777',
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
