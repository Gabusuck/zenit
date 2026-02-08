import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

export default function MyGamesScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { user } = useUser();

    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

    const fetchMyGames = async () => {
        if (!user) return;

        try {
            // Fetch games user is participating in
            const { data: playerGames, error: playerError } = await supabase
                .from('game_players')
                .select('game_id, status')
                .eq('user_id', user.id);

            if (playerError) throw playerError;

            const gameIds = playerGames.map((pg: any) => pg.game_id);
            const statusMap = playerGames.reduce((acc: any, pg: any) => {
                acc[pg.game_id] = pg.status;
                return acc;
            }, {});

            if (gameIds.length === 0) {
                setGames([]);
                setLoading(false);
                return;
            }

            const { data: gamesData, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .in('id', gameIds)
                .order('date', { ascending: true }); // Order by date for upcoming

            if (gamesError) throw gamesError;

            const mergedGames = gamesData.map((g: any) => ({
                ...g,
                user_status: statusMap[g.id]
            }));

            setGames(mergedGames || []);
        } catch (error) {
            console.error('Error fetching my games:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMyGames();
        }, [user])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyGames();
        setRefreshing(false);
    };

    const parseGameDate = (game: any) => {
        let gameDate = new Date();
        try {
            if (game.date) {
                const [day, month, year] = game.date.split('/').map(Number);
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    gameDate = new Date(year, month - 1, day);
                    if (game.time) {
                        const [hours, minutes] = game.time.split(':').map(Number);
                        if (!isNaN(hours) && !isNaN(minutes)) {
                            gameDate.setHours(hours, minutes, 0, 0);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Error parsing date:', game.date);
        }
        return gameDate;
    };

    const filterGames = () => {
        const now = new Date();
        const filtered = games.filter(game => {
            const gameDate = parseGameDate(game);
            const isCanceled = game.status === 'canceled';
            const isFinished = game.status === 'finished';

            if (activeTab === 'upcoming') {
                // Return true if game is in the future (or present)
                return !isCanceled && !isFinished && gameDate >= now;
            } else {
                // History: past games OR canceled/finished
                return isCanceled || isFinished || gameDate < now;
            }
        });

        // Sort based on tab
        return filtered.sort((a, b) => {
            const dateA = parseGameDate(a).getTime();
            const dateB = parseGameDate(b).getTime();

            if (activeTab === 'history') {
                return dateB - dateA; // Descending (Newest first)
            } else {
                return dateA - dateB; // Ascending (Soonest first)
            }
        });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/game/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.location}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.user_status === 'no_show' && (
                        <View style={[styles.canceledBadge, { marginRight: 5 }]}>
                            <Text style={styles.canceledText}>FALTOU</Text>
                        </View>
                    )}
                    {item.status === 'canceled' && (
                        <View style={styles.canceledBadge}>
                            <Text style={styles.canceledText}>Cancelado</Text>
                        </View>
                    )}
                </View>
            </View>
            <Text style={styles.cardTime}>{item.date} às {item.time ? item.time.slice(0, 5) : ''}</Text>
            <Text style={[styles.cardSlots, { color: themeColors.primary }]}>
                {item.filled_slots} / {item.total_slots} Vagas
            </Text>
        </TouchableOpacity>
    );

    const filteredGames = filterGames();

    return (
        <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
            <Stack.Screen options={{
                title: 'Meus Jogos',
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
            }} />
            <StatusBar style="light" />

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && { borderBottomColor: themeColors.primary, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && { color: themeColors.primary, fontWeight: 'bold' }]}>Próximos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && { borderBottomColor: themeColors.primary, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && { color: themeColors.primary, fontWeight: 'bold' }]}>Histórico</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredGames}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: '#999' }}>
                                {activeTab === 'upcoming' ? 'Não tens jogos agendados.' : 'Sem histórico de jogos.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        elevation: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    listContainer: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    cardTime: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    cardSlots: {
        fontSize: 14,
        fontWeight: '600',
    },
    canceledBadge: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    canceledText: {
        color: '#F44336',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
