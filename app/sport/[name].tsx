import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

import GameCard from '@/components/GameCard';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

export default function SportFeedScreen() {
    const { name } = useLocalSearchParams();
    const sportName = Array.isArray(name) ? name[0] : name;

    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { user } = useUser();

    const [games, setGames] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchSportGames = async () => {
        try {
            const { data, error } = await supabase
                .from('games')
                .select(`
          *,
          game_players (
            user_id,
            status,
            profiles (
              avatar_url,
              name
            )
          )
        `)
                .neq('status', 'canceled')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching games:', error);
            } else {
                const now = new Date();
                const activeGames = (data || []).filter(game => {
                    if (game.status === 'finished') return false;

                    // Filter by Sport (searching in description)
                    // This is a temporary solution until we have a proper 'sport' column
                    const isSportMatch = game.description && game.description.includes(`Modalidade: ${sportName}`);
                    if (!isSportMatch) return false;

                    // Date Check
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
                        return gameDate >= now;
                    } catch (e) {
                        return true;
                    }
                });

                setGames(activeGames);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSportGames();
        setRefreshing(false);
    }, [sportName]);

    useFocusEffect(
        useCallback(() => {
            fetchSportGames();
        }, [sportName])
    );

    const handleCreateGame = () => {
        router.push({
            pathname: '/create-game',
            params: { sport: sportName }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
            <Stack.Screen options={{
                title: sportName || 'Modalidade',
                headerStyle: { backgroundColor: themeColors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                ),
            }} />

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={games}
                    renderItem={({ item }) => <GameCard item={item} themeColors={themeColors} user={user} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 100, padding: 20 }}>
                            <FontAwesome name="soccer-ball-o" size={50} color="#ddd" />
                            <Text style={{ color: '#999', marginTop: 20, fontSize: 16, textAlign: 'center' }}>
                                Não há jogos de {sportName} agendados.
                            </Text>
                            <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', marginTop: 5 }}>
                                Sê o primeiro a organizar um!
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: themeColors.primary }]}
                onPress={handleCreateGame}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={30} color="#fff" />
                <Text style={styles.fabText}>Criar Jogo</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    fabText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 5,
    },
});
