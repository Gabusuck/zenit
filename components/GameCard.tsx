import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';

interface GameCardProps {
    item: any;
    themeColors: any;
    user: any;
}

export default function GameCard({ item, themeColors, user }: GameCardProps) {
    // Process Participants
    const participants = item.game_players || [];
    // Sort to put current user first if present
    const sortedParticipants = [...participants].sort((a: any, b: any) => {
        if (a.user_id === user?.id) return -1;
        if (b.user_id === user?.id) return 1;
        return 0;
    });

    const isParticipating = participants.some((p: any) => p.user_id === user?.id);

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/game/${item.id}`)}
        >
            <View style={[styles.cardHeader, { backgroundColor: 'transparent' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.location}</Text>
                    {item.is_private && (
                        <FontAwesome name="lock" size={14} color="#FF9800" style={{ marginLeft: 8 }} />
                    )}
                </View>
                <FontAwesome name="soccer-ball-o" size={16} color="#000" />
            </View>

            <Text style={styles.cardTime}>{item.date} às {item.time ? item.time.slice(0, 5) : ''}</Text>
            <Text style={[styles.cardSlots, { color: themeColors.primary }]}>{item.filled_slots} / {item.total_slots} Vagas Preenchidas</Text>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>Presença: {item.price}€</Text>

            <View style={styles.cardFooter}>
                {/* Avatars Section */}
                <View style={styles.avatarContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Real Face Pile */}
                        {sortedParticipants.slice(0, 4).map((player: any, index: number) => (
                            <Image
                                key={player.user_id}
                                source={{ uri: player.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${player.user_id}` }}
                                style={[
                                    styles.avatar,
                                    {
                                        marginLeft: index === 0 ? 0 : -12,
                                        zIndex: 4 - index,
                                        borderWidth: 2,
                                        borderColor: '#fff'
                                    }
                                ]}
                            />
                        ))}

                        {/* Overflow Count if > 4 */}
                        {participants.length > 4 && (
                            <View style={[styles.moreAvatars, { marginLeft: -12, zIndex: 0 }]}>
                                <Text style={styles.moreAvatarsText}>+{participants.length - 4}</Text>
                            </View>
                        )}

                        {/* If no participants, show placeholder or text */}
                        {participants.length === 0 && (
                            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0', borderWidth: 1, borderColor: '#fff' }]}>
                                <FontAwesome name="user" size={12} color="#999" />
                            </View>
                        )}

                        <Text style={styles.slotsText}>
                            {item.filled_slots === 0 ? 'Sem jogadores' :
                                item.filled_slots === 1 ? '1 jogador' :
                                    `${item.filled_slots} jogadores`}
                        </Text>
                    </View>
                </View>

                {/* Join Button */}
                <TouchableOpacity
                    style={[
                        styles.joinButton,
                        { backgroundColor: isParticipating ? '#fff' : themeColors.primary },
                        isParticipating && { borderWidth: 1, borderColor: themeColors.primary }
                    ]}
                    onPress={() => router.push(`/game/${item.id}`)}
                >
                    <Text style={[
                        styles.joinButtonText,
                        isParticipating && { color: themeColors.primary }
                    ]}>
                        {isParticipating ? 'Inscrito' : 'Juntar-me'}
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
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
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    avatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginLeft: -10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    moreAvatars: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    moreAvatarsText: {
        fontSize: 10,
        color: '#666',
        fontWeight: 'bold',
    },
    slotsText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 10,
    },
    joinButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
