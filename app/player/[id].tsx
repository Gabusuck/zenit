import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import AttendanceModal from '@/components/AttendanceModal';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { BADGES } from '@/constants/Badges';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasPenalty, setHasPenalty] = useState(false);


    // ... inside component ...
    const [selectedBadge, setSelectedBadge] = useState<any>(null);
    const [isBadgeModalVisible, setIsBadgeModalVisible] = useState(false);
    const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState(false);

    // ... inside render ...


    useEffect(() => {
        if (id) {
            fetchProfile();
            fetchPenaltyStats();
        }
    }, [id]);

    const fetchProfile = async () => {
        console.log('Fetching profile for ID:', id);
        if (!id) {
            console.error('No ID provided to fetchProfile');
            setError('ID do utilizador não fornecido.');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching public profile:', error);
                setError('Erro ao carregar perfil: ' + error.message);
            } else {
                console.log('Profile fetched successfully:', data);

                // Calculate Attendance (Assiduidade)
                let attendanceValue = data.attendance || '-';
                try {
                    console.log('Calculating attendance for user:', id);
                    const { data: attendanceData, error: attendanceError } = await supabase
                        .from('game_players')
                        .select('status')
                        .eq('user_id', id)
                        .in('status', ['attended', 'no_show']);

                    console.log('Attendance Data:', attendanceData);
                    console.log('Attendance Error:', attendanceError);

                    if (!attendanceError && attendanceData && attendanceData.length > 0) {
                        const total = attendanceData.length;
                        const attended = attendanceData.filter((p: any) => p.status === 'attended').length;
                        const percentage = Math.round((attended / total) * 100);
                        console.log(`Calc: ${attended}/${total} = ${percentage}%`);
                        attendanceValue = `${percentage}%`;
                    } else {
                        attendanceValue = '100%';
                    }
                } catch (e) {
                    console.error('Error calculating public attendance:', e);
                }

                setProfile({ ...data, attendance: attendanceValue });
            }
        } catch (e) {
            console.error('Unexpected error:', e);
            setError('Erro inesperado: ' + JSON.stringify(e));
        } finally {
            setLoading(false);
        }
    };

    const fetchPenaltyStats = async () => {
        try {
            // Check for penalty (no_show in last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // We need to fetch games where this user was a player with status="no_show"
            // and check the GAME DATE, or simply rely on created_at of the record for simplicity if easier
            // but the accurate way is via the game date.

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
                    const [day, month, year] = p.games.date.split('/').map(Number);
                    const gameDate = new Date(year, month - 1, day);
                    return gameDate >= sevenDaysAgo;
                });
                setHasPenalty(hasRecent);
            }
        } catch (e) {
            console.error('Error fetching penalty stats:', e);
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

                    <View style={styles.ratingContainer}>
                        <View style={{ flexDirection: 'row', marginRight: 5 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesome
                                    key={star}
                                    name="star"
                                    size={16}
                                    color={star <= (profile.rating || 0) ? "#FFD700" : "#E0E0E0"}
                                    style={{ marginHorizontal: 1 }}
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingCount}>({profile.rating_count || 0} avaliações)</Text>
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
                        onPress={() => {
                            if (profile.featured_badge_id) {
                                const badge = BADGES?.find(b => b.id === profile.featured_badge_id);
                                if (badge) {
                                    setSelectedBadge(badge);
                                    setIsBadgeModalVisible(true);
                                }
                            }
                        }}
                        activeOpacity={profile.featured_badge_id ? 0.7 : 1}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#fff8e1' }]}>
                            {profile.featured_badge_id ? (
                                (() => {
                                    const badge = BADGES?.find(b => b.id === profile.featured_badge_id);
                                    return badge ? (
                                        <FontAwesome5 name={badge.icon} size={20} color={badge.color} />
                                    ) : (
                                        <FontAwesome5 name="trophy" size={20} color="#FFC107" />
                                    );
                                })()
                            ) : (
                                <FontAwesome5 name="trophy" size={20} color="#FFC107" />
                            )}
                        </View>
                        {profile.featured_badge_id ? (
                            <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 2 }}>
                                {BADGES?.find(b => b.id === profile.featured_badge_id)?.name || '-'}
                            </Text>
                        ) : (
                            <Text style={styles.statValue}>{profile.badges_count || '-'}</Text>
                        )}
                        {!profile.featured_badge_id && <Text style={styles.statLabel}>Conquistas</Text>}
                    </TouchableOpacity>

                    <View style={styles.statDivider} />

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

                {/* Extra space */}
                <View style={{ height: 50 }} />

            </ScrollView>


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
                                {selectedBadge && (
                                    <View style={{ alignItems: 'center' }}>
                                        <View style={[styles.iconCircle, { backgroundColor: selectedBadge.color + '20', width: 80, height: 80, borderRadius: 40, marginBottom: 15 }]}>
                                            <FontAwesome5 name={selectedBadge.icon} size={40} color={selectedBadge.color} />
                                        </View>
                                        <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                                        <Text style={styles.modalDescription}>{selectedBadge.description}</Text>


                                    </View>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
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
});
