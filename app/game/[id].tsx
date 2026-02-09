
import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

export default function GameDetailsScreen() {
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { user, refreshProfile } = useUser();

    const [game, setGame] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [isJoined, setIsJoined] = useState(false);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchGameDetails();
        fetchPlayers();
    }, [id]);

    // Auto-confirm attendance when game is finished and user is organizer
    useEffect(() => {
        if (game && user && game.created_by === user.id && isGameFinished()) {
            autoConfirmAttendance();
        }
    }, [game, user, players]); // Check when players load too

    const autoConfirmAttendance = async () => {
        // Find players who are just 'confirmed' (not yet attended/no_show)
        const pendingPlayers = players.filter(p => p.status === 'confirmed');

        if (pendingPlayers.length > 0) {
            console.log("Auto-confirming players:", pendingPlayers.length);
            try {
                // Bulk update 'confirmed' -> 'attended'
                // We use loop for now as RLS/Supabase Client matches simpler
                const updates = pendingPlayers.map(p =>
                    supabase
                        .from('game_players')
                        .update({ status: 'attended' })
                        .eq('game_id', id)
                        .eq('user_id', p.user_id)
                );

                await Promise.all(updates);
                fetchPlayers(); // Refresh to show 'Attended'
                refreshProfile(); // Update user stats immediately
            } catch (error) {
                console.error("Error auto-confirming attendance:", error);
            }
        }
    };

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
                    user_id: item.user_id, // Explicitly map user_id from game_players
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

    const checkGameStartingSoon = () => {
        if (!game || !game.date || !game.time) return false;

        try {
            const [day, month, year] = game.date.split('/').map(Number);
            const [hours, minutes] = game.time.split(':').map(Number);

            const gameDate = new Date(year, month - 1, day, hours, minutes);
            const now = new Date();

            // Check if difference is less than 1 hour (3600000 ms)
            const diff = gameDate.getTime() - now.getTime();
            return diff < 3600000;
        } catch (e) {
            console.error('Error parsing date/time for restriction check:', e);
            return false;
        }
    };

    const isGameStarted = () => {
        if (!game || !game.date || !game.time) return false;

        try {
            const [day, month, year] = game.date.split('/').map(Number);
            const [hours, minutes] = game.time.split(':').map(Number);

            const gameDate = new Date(year, month - 1, day, hours, minutes);
            const now = new Date();

            return now >= gameDate;
        } catch (e) {
            return false;
        }
    };

    // Helper to check if game is "Finished" (e.g., end time passed or just start time passed for simplicity)
    const isGameFinished = () => {
        return isGameStarted(); // For now, treat started as "in progress/finished" for attendance purposes
    };

    const handleJoinGame = async () => {
        if (!user || !game) {
            if (!user) alert('Tens de fazer login primeiro.');
            return;
        }
        setJoining(true);

        try {
            if (isJoined) {
                // Check if < 1h to start
                if (checkGameStartingSoon()) {
                    alert('Não podes sair do jogo a menos de 1h do início!');
                    return;
                }

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

    const handleCancelGame = async () => {
        if (!user || user.id !== game?.created_by) return;

        // Check if < 1h to start
        if (checkGameStartingSoon()) {
            // DEBUG: Show why it's blocked
            // alert('Start: ' + game.date + ' ' + game.time + '\nNow: ' + new Date().toLocaleTimeString());
            alert('Não podes cancelar o jogo a menos de 1h do início!');
            return;
        }

        Alert.alert(
            "Cancelar Jogo",
            "Tens a certeza que queres cancelar este jogo? Esta ação não pode ser desfeita.",
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            // Soft delete: update status to 'canceled'
                            const { error } = await supabase
                                .from('games')
                                .update({ status: 'canceled' })
                                .eq('id', id);

                            if (error) throw error;

                            alert('Jogo cancelado com sucesso.');
                            // Navigate to My Games instead of Home
                            router.replace('/my-games');
                        } catch (error) {
                            console.error('Error cancelling game:', error);
                            alert('Erro ao cancelar jogo.');
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const togglePlayerAttendance = async (player: any) => {
        if (!user || game.created_by !== user.id || !isGameFinished()) return;

        const newStatus = player.status === 'attended' || player.status === 'confirmed' ? 'no_show' : 'attended';

        // Optimistic Update
        const updatedPlayers = players.map(p =>
            p.user_id === player.user_id ? { ...p, status: newStatus } : p
        );
        setPlayers(updatedPlayers);

        try {
            const { error } = await supabase
                .from('game_players')
                .update({ status: newStatus })
                .eq('game_id', id)
                .eq('user_id', player.user_id);

            if (error) throw error;

            // If the modified player is the current user, refresh profile logic
            if (player.user_id === user?.id) {
                refreshProfile();
            }
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('Erro ao atualizar presença.');
            fetchPlayers(); // Revert
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

    const isOrganizer = user && game && user.id === game.created_by;
    const gameFinished = isGameFinished();

    return (
        <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
            <Stack.Screen options={{
                title: 'Detalhes do Jogo',
                headerStyle: { backgroundColor: themeColors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ padding: 10, marginLeft: 0, marginTop: -2 }}
                    >
                        <FontAwesome5 name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    (isOrganizer && game.status !== 'canceled' && !gameFinished) ? (
                        <TouchableOpacity
                            onPress={handleCancelGame}
                            style={{ padding: 10, marginRight: 0 }}
                        >
                            <FontAwesome5 name="trash" size={22} color="#fff" />
                        </TouchableOpacity>
                    ) : null
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
                {/* Status / Slots - Hide if canceled */}
                {game.status !== 'canceled' ? (
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
                ) : (
                    <View style={[styles.card, { backgroundColor: '#FFEBEE', borderColor: '#F44336', borderWidth: 1 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <FontAwesome5 name="ban" size={20} color="#F44336" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#F44336' }}>Jogo Cancelado</Text>
                        </View>
                    </View>
                )}

                {/* Players List */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Jogadores ({players.length})</Text>
                        {isOrganizer && gameFinished && (
                            <Text style={{ fontSize: 10, color: '#666' }}>Toque para marcar falta</Text>
                        )}
                    </View>

                    {players.length > 0 ? (
                        players.map((player, index) => (
                            <TouchableOpacity
                                key={`player-${player.user_id || index}`}
                                style={styles.playerRow}
                                onPress={() => router.push(`/player/${player.user_id}`)}
                            >
                                <Image
                                    source={{ uri: player.avatar_url || 'https://via.placeholder.com/150' }}
                                    style={styles.playerAvatar}
                                />
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.playerName}>{player.name || 'Jogador'}</Text>

                                        {/* Status Indicators */}
                                        {player.status === 'attended' && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                                <FontAwesome5 name="check" size={10} color="#4CAF50" style={{ marginRight: 4 }} />
                                                <Text style={{ color: '#4CAF50', fontSize: 10, fontWeight: 'bold' }}>PRESENTE</Text>
                                            </View>
                                        )}
                                        {player.status === 'no_show' && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                                <FontAwesome5 name="times" size={10} color="#F44336" style={{ marginRight: 4 }} />
                                                <Text style={{ color: '#F44336', fontSize: 10, fontWeight: 'bold' }}>FALTOU</Text>
                                            </View>
                                        )}
                                        {player.status === 'confirmed' && !gameFinished && (
                                            <View style={{ backgroundColor: '#E3F2FD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                <Text style={{ color: '#2196F3', fontSize: 10, fontWeight: 'bold' }}>INSCRITO</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.playerUsername}>{player.username || '@jogador'}</Text>
                                </View>

                                {/* Toggle Switch UI for Organizer */}
                                {isOrganizer && gameFinished && (
                                    <View style={{ marginLeft: 10 }}>
                                        <Switch
                                            value={player.status === 'attended'}
                                            onValueChange={() => togglePlayerAttendance(player)}
                                            trackColor={{ false: '#ffcdd2', true: '#C8E6C9' }}
                                            thumbColor={player.status === 'attended' ? '#4CAF50' : '#F44336'}
                                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>
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
                {/* Hide join button if game finished */}
                {!gameFinished && (
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
                )}
                {/* If game finished and organizer, maybe show a "Done" button or just nothing as it's auto-saved */}
                {gameFinished && isOrganizer && (
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: '#666', fontSize: 12 }}>Gestão de presenças ativa</Text>
                    </View>
                )}
                {gameFinished && !isOrganizer && isJoined && (
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: themeColors.primary, fontWeight: 'bold' }}>Jogo Terminado</Text>
                    </View>
                )}
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    attendanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingBottom: 40,
    },
});
