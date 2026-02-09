import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import AttendanceModal from '@/components/AttendanceModal';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { calculateUserBadges, UserStats } from '@/utils/badges';

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasPenalty, setHasPenalty] = useState(false);


    // ... inside component ...
    const [userBadges, setUserBadges] = useState<any[]>([]);
    const [selectedBadge, setSelectedBadge] = useState<any>(null);
    const [isBadgeModalVisible, setIsBadgeModalVisible] = useState(false);
    const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState(false);
    const [games, setGames] = useState<any[]>([]);

    // ... inside render ...


    useEffect(() => {
        if (id) {
            fetchProfile();
            fetchPenaltyStats();
            fetchGames();
        }
    }, [id]);

    const fetchProfile = async () => {
        console.log('Fetching profile for ID:', id);
        if (!id) {
            setError('ID do utilizador não fornecido.');
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch Profile
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            console.log('Profile fetched successfully:', profileData);

            // 2. Fetch Games Organized Count
            const { count: organizedCount, error: organizedError } = await supabase
                .from('games')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', id);

            if (organizedError) console.error('Error fetching organized count:', organizedError);

            // 2.5 Fetch Games Played (Attended)
            const { count: playedCount, error: playedError } = await supabase
                .from('game_players')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', id)
                .eq('status', 'attended');

            if (playedError) console.error('Error fetching played count:', playedError);

            // 3. Calculate Attendance
            let attendanceValue = profileData.attendance || '-';
            // ... (rest of logic)

            // Calculate Badges
            // Calculate Account Age
            const createdAt = profileData.created_at ? new Date(profileData.created_at) : new Date();
            const now = new Date();
            const monthsDiff = (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth());

            // Calculate Profile Completion
            let completionScore = 0;
            if (profileData.avatar_url) completionScore += 25;
            if (profileData.position) completionScore += 25;
            if (profileData.foot) completionScore += 25;
            if (profileData.age) completionScore += 25;

            const stats: UserStats = {
                gamesPlayed: playedCount || 0,
                gamesOrganized: organizedCount || 0,
                rating: profileData.rating || 0,
                ratingCount: profileData.rating_count || 0,
                accountAgeInMonths: monthsDiff,
                profileCompletion: completionScore
            };

            const badges = calculateUserBadges(stats);
            setUserBadges(badges);

            // Existing Attendance Code (Simplified preserve)
            try {
                const { data: attendanceData, error: attendanceError } = await supabase
                    .from('game_players')
                    .select('status')
                    .eq('user_id', id)
                    .in('status', ['attended', 'no_show']);

                if (!attendanceError && attendanceData && attendanceData.length > 0) {
                    const total = attendanceData.length;
                    const attended = attendanceData.filter((p: any) => p.status === 'attended').length;
                    const percentage = Math.round((attended / total) * 100);
                    attendanceValue = `${percentage}%`;
                } else {
                    attendanceValue = '100%';
                }
            } catch (e) {
                console.error('Error calculating public attendance:', e);
            }

            setProfile({ ...profileData, attendance: attendanceValue });

        } catch (e) {
            console.error('Unexpected error:', e);
            setError('Erro ao carregar perfil.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPenaltyStats = async () => {
        try {
            // Check for penalty (no_show in last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: penaltyData, error: penaltyDataError } = await supabase
                .from('game_players')
                .select(`
                    game_id,
                    games (
                        date
                    )
                `)
                .eq('user_id', id)
                .eq('status', 'no_show');

            if (!penaltyDataError && penaltyData) {
                const hasRecent = penaltyData.some((p: any) => {
                    if (!p.games?.date) return false;
                    try {
                        const [day, month, year] = p.games.date.split('/').map(Number);
                        const gameDate = new Date(year, month - 1, day);
                        return gameDate >= sevenDaysAgo;
                    } catch (e) {
                        return false;
                    }
                });
                setHasPenalty(hasRecent);
            }
        } catch (e) {
            console.error('Error fetching penalty stats:', e);
        }
    };

    const fetchGames = async () => {
        try {
            const { data: playerGames, error: playerError } = await supabase
                .from('game_players')
                .select('game_id, status')
                .eq('user_id', id);

            if (playerError) throw playerError;

            const gameIds = playerGames.map((pg: any) => pg.game_id);
            const statusMap = playerGames.reduce((acc: any, pg: any) => {
                acc[pg.game_id] = pg.status;
                return acc;
            }, {});

            if (gameIds.length === 0) {
                setGames([]);
                return;
            }

            const { data: gamesData, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .in('id', gameIds)
                .order('date', { ascending: false });

            if (gamesError) throw gamesError;

            const now = new Date();
            const historyGames = gamesData.map((g: any) => ({
                ...g,
                user_status: statusMap[g.id]
            })).filter((g: any) => {
                try {
                    const [day, month, year] = g.date.split('/').map(Number);
                    const [hours, minutes] = g.time.split(':').map(Number);
                    const gameDate = new Date(year, month - 1, day, hours, minutes);
                    return g.status === 'finished' || g.status === 'canceled' || gameDate < now;
                } catch (e) {
                    return false;
                }
            });

            setGames(historyGames || []);
        } catch (e) {
            console.error('Error fetching games:', e);
        }
    };

    const getLevelDescription = (lvl: number) => {
        if (lvl <= 3) return "Iniciante";
        if (lvl <= 7) return "Intermédio";
        return "Avançado";
    }

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        );
    }

    if (error || !profile) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>{error || 'Perfil não encontrado.'}</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: themeColors.primary }}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <Stack.Screen options={{
                title: 'Perfil de Jogador',
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

            <ScrollView contentContainerStyle={styles.scrollContainer}>

                {/* Header Section - Matched to Private Profile */}
                <View style={styles.header}>
                    {hasPenalty && (
                        <View style={styles.penaltyBanner}>
                            <FontAwesome5 name="exclamation-circle" size={16} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.penaltyBannerText}>Faltou Recentemente</Text>
                        </View>
                    )}

                    <View style={[styles.avatarContainer, hasPenalty && styles.penaltyAvatarBorder]}>
                        {profile.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} resizeMode="cover" />
                        ) : (
                            <View style={[styles.avatar, styles.defaultAvatar]}>
                                <FontAwesome5 name="user" size={50} color="#fff" />
                            </View>
                        )}
                    </View>

                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>Nível {profile.level || 1}</Text>
                    </View>

                    <View style={styles.nameContainer}>
                        <View style={styles.nameWrapper}>
                            <Text style={styles.name}>{profile.name || 'Utilizador'}</Text>
                        </View>
                    </View>

                    <Text style={styles.username}>{profile.username || '@utilizador'}</Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 5 }}>
                        {(profile.featured_badge_ids && Array.isArray(profile.featured_badge_ids) && profile.featured_badge_ids.length > 0
                            ? profile.featured_badge_ids
                            : (profile.featured_badge_id ? [profile.featured_badge_id] : [])
                        ).map((badgeId: string) => {
                            const pinnedBadge = userBadges.find(b => b.definitionId === badgeId);
                            if (!pinnedBadge) return null;
                            return (
                                <View key={badgeId} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: pinnedBadge.color + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, marginHorizontal: 3, marginBottom: 3 }}>
                                    <FontAwesome5 name={pinnedBadge.icon} size={12} color={pinnedBadge.color} style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: pinnedBadge.color }}>{pinnedBadge.name}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Stats Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
                            <Ionicons name="football" size={24} color="#4CAF50" />
                        </View>
                        <Text style={styles.statValue}>{profile.games_played || 0}</Text>
                        <Text style={styles.statLabel}>Jogos</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statDivider} />
                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => setIsBadgeModalVisible(true)}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#fff8e1' }]}>
                            <FontAwesome5 name="trophy" size={20} color="#FFC107" />
                        </View>
                        <Text style={styles.statValue}>{userBadges.filter((b: any) => b.earned).length}</Text>
                        <Text style={styles.statLabel}>Conquistas</Text>
                    </TouchableOpacity>

                    <View style={styles.statDivider} />

                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => setIsAttendanceModalVisible(true)}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                            <MaterialCommunityIcons name="calendar-check" size={24} color="#2196F3" />
                        </View>
                        <Text style={styles.statValue}>{profile.attendance || '-'}</Text>
                        <Text style={styles.statLabel}>Assiduidade</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />

                {/* Player Details */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Detalhes do Jogador</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="shirt-outline" size={20} color="#666" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Posição preferida:</Text>
                            <Text style={styles.detailValue}>{profile.position || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <MaterialCommunityIcons name="shoe-print" size={20} color="#666" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Pé dominante:</Text>
                            <Text style={styles.detailValue}>{profile.foot || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="stats-chart" size={20} color="#666" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Nível:</Text>
                            <Text style={styles.detailValue}>{getLevelDescription(profile.level || 1)} ({profile.level || 1})</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <FontAwesome name="calendar" size={20} color="#666" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Idade:</Text>
                            <Text style={styles.detailValue}>{profile.age || '-'}</Text>
                        </View>
                    </View>
                </View>

                {/* Games List */}
                <View style={[styles.sectionContainer, { marginTop: 20 }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Jogos Realizados ({games.length})</Text>
                    </View>

                    {games.length > 0 ? (
                        games.map((game) => (
                            <TouchableOpacity
                                key={game.id}
                                style={styles.gameCard}
                                onPress={() => router.push(`/game/${game.id}`)}
                            >
                                <View style={styles.gameCardHeader}>
                                    <Text style={styles.gameCardTitle}>{game.location}</Text>
                                    <Text style={styles.gameCardDate}>{game.date} - {game.time?.slice(0, 5)}</Text>
                                </View>
                                {/* <Text style={styles.gameCardStatus}>Concluído</Text> */}
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ fontStyle: 'italic', color: '#999', textAlign: 'center', padding: 10 }}>
                            Ainda não realizou jogos.
                        </Text>
                    )}
                </View>

                {/* Extra space */}
                <View style={{ height: 50 }} />

            </ScrollView >


            <AttendanceModal
                visible={isAttendanceModalVisible}
                onClose={() => setIsAttendanceModalVisible(false)}
                attendance={profile.attendance || '-'}
            />

            {/* Badge Detail Modal */}
            <Modal
                visible={isBadgeModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsBadgeModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsBadgeModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { position: 'relative' }]}>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setIsBadgeModalVisible(false)}
                                >
                                    <Ionicons name="close" size={24} color="#999" />
                                </TouchableOpacity>

                                {selectedBadge ? (
                                    <View style={{ alignItems: 'center', width: '100%' }}>
                                        <TouchableOpacity
                                            style={{ position: 'absolute', left: 0, top: 0, padding: 10, zIndex: 20 }}
                                            onPress={() => setSelectedBadge(null)}
                                        >
                                            <Ionicons name="arrow-back" size={24} color="#333" />
                                        </TouchableOpacity>

                                        <View style={[styles.iconCircle, { backgroundColor: selectedBadge.color + '20', width: 80, height: 80, borderRadius: 40, marginBottom: 15 }]}>
                                            <FontAwesome5 name={selectedBadge.icon} size={40} color={selectedBadge.color} />
                                        </View>
                                        <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                                        <Text style={styles.modalDescription}>{selectedBadge.description}</Text>

                                        <View style={{ marginTop: 20, width: '100%' }}>
                                            <Text style={{ textAlign: 'center', marginBottom: 5, color: '#666' }}>
                                                {selectedBadge.progress} / {selectedBadge.target}
                                            </Text>
                                            <View style={styles.progressBarBg}>
                                                <View
                                                    style={[
                                                        styles.progressBarFill,
                                                        {
                                                            width: `${Math.min(100, (selectedBadge.progress / selectedBadge.target) * 100)}%`,
                                                            backgroundColor: selectedBadge.earned ? selectedBadge.color : '#bdbdbd'
                                                        }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={{ textAlign: 'center', marginTop: 5, fontSize: 12, color: '#999' }}>
                                                {selectedBadge.earned
                                                    ? (selectedBadge.nextTier ? `Próximo nível: ${selectedBadge.nextTier}` : 'Nível máximo!')
                                                    : 'Bloqueado'}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={{ width: '100%', maxHeight: 400 }}>
                                        <Text style={styles.modalTitle}>Todas as Conquistas</Text>
                                        <ScrollView contentContainerStyle={{ paddingVertical: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {userBadges.map((badge) => (
                                                <TouchableOpacity
                                                    key={badge.definitionId}
                                                    style={{ margin: 10, alignItems: 'center' }}
                                                    onPress={() => setSelectedBadge(badge)}
                                                >
                                                    <View style={[styles.badgeIcon, { width: 60, height: 60, borderRadius: 30, backgroundColor: badge.earned ? badge.color + '20' : '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
                                                        <FontAwesome5
                                                            name={badge.icon}
                                                            size={24}
                                                            color={badge.earned ? badge.color : '#bdbdbd'}
                                                        />
                                                    </View>
                                                    <Text style={{ fontSize: 10, marginTop: 4, color: badge.earned ? '#333' : '#999', width: 70, textAlign: 'center' }} numberOfLines={1}>
                                                        {badge.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    avatarContainer: {
        marginBottom: 10,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    defaultAvatar: {
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: -15, // Overlap avatar slightly? Or just below
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#F5F5F5',
        zIndex: 1,
    },
    levelText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    nameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    nameWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        alignSelf: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    username: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ratingCount: {
        fontSize: 12,
        color: '#666',
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        width: '90%',
        borderRadius: 20,
        padding: 15,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#eee',
    },
    sectionContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    detailIconContainer: {
        width: 30,
        alignItems: 'center',
        marginRight: 10,
    },
    detailContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 5,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    // Penalty Styles
    penaltyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F44336',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 15,
    },
    penaltyBannerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    penaltyAvatarBorder: {
        borderWidth: 3,
        borderColor: '#F44336',
        borderRadius: 55, // Slightly larger than avatar radius + border
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
        zIndex: 10,
    },
    // Badge List Styles
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 5,
    },
    badgeIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    badgeProgressText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        marginBottom: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    // Game Card Styles for Profile
    gameCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    gameCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gameCardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    gameCardDate: {
        fontSize: 12,
        color: '#666',
        marginLeft: 10,
    },
    gameCardStatus: {
        fontSize: 12,
        color: '#4CAF50',
        marginTop: 4,
        fontWeight: 'bold',
    },
    badgeNextGoal: {
        fontSize: 10,
        color: '#999',
        fontStyle: 'italic',
    },
});
