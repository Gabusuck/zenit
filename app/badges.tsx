
import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';

import { BADGES } from '@/constants/Badges';

export default function BadgesScreen() {
    const colorScheme = useColorScheme();
    const [selectedBadge, setSelectedBadge] = useState<any>(null);

    const renderBadge = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.badgeItem}
            onPress={() => setSelectedBadge(item)}
        >
            <View style={[
                styles.iconContainer,
                { backgroundColor: item.earned ? item.color + '20' : '#eee' },
                // !item.earned && { opacity: 0.5 } // Optional extra dimming
            ]}>
                <FontAwesome5
                    name={item.icon}
                    size={32}
                    color={item.earned ? item.color : '#ccc'}
                />
            </View>
            {/* Optional: Lock icon overlay */}
            {!item.earned && (
                <View style={styles.lockOverlay}>
                    <FontAwesome5 name="lock" size={12} color="#999" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen options={{
                title: 'Conquistas',
                headerStyle: { backgroundColor: '#f2f2f2' },
                headerShadowVisible: false,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <FontAwesome5 name="arrow-left" size={20} color="#333" />
                    </TouchableOpacity>
                ),
            }} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>As tuas Medalhas</Text>
                <Text style={styles.headerSubtitle}>
                    {BADGES.filter(b => b.earned).length} de {BADGES.length} desbloqueadas
                </Text>
            </View>

            <FlatList
                data={BADGES}
                renderItem={renderBadge}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                numColumns={3}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
            />

            {/* Detail Modal */}
            <Modal
                visible={!!selectedBadge}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedBadge(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedBadge(null)}
                >
                    <View style={styles.modalContent}>
                        {selectedBadge && (
                            <>
                                <View style={[styles.modalIconContainer, { backgroundColor: selectedBadge.earned ? selectedBadge.color + '20' : '#eee' }]}>
                                    <FontAwesome5
                                        name={selectedBadge.icon}
                                        size={50}
                                        color={selectedBadge.earned ? selectedBadge.color : '#ccc'}
                                    />
                                </View>
                                <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                                <Text style={styles.modalDescription}>{selectedBadge.description}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: selectedBadge.earned ? '#4CAF50' : '#ccc' }]}>
                                    <Text style={styles.statusText}>
                                        {selectedBadge.earned ? 'DESBLOQUEADO' : 'BLOQUEADO'}
                                    </Text>
                                </View>

                                {!selectedBadge.earned && (
                                    <View style={styles.progressContainer}>
                                        <Text style={styles.progressText}>
                                            Progresso: {selectedBadge.progress} / {selectedBadge.target}
                                        </Text>
                                        <View style={styles.progressBarBackground}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    {
                                                        width: `${Math.min((selectedBadge.progress / selectedBadge.target) * 100, 100)}%`,
                                                        backgroundColor: selectedBadge.color
                                                    }
                                                ]}
                                            />
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f2',
    },
    header: {
        padding: 20,
        paddingTop: 0,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    list: {
        padding: 20,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    badgeItem: {
        width: '30%',
        alignItems: 'center',
        position: 'relative',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    lockOverlay: {
        position: 'absolute',
        top: 0,
        right: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 4,
        elevation: 2,
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
    },
    modalIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    statusBadge: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    progressContainer: {
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600',
    },
    progressBarBackground: {
        width: '100%',
        height: 10,
        backgroundColor: '#eee',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
});
