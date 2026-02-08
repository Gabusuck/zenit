
import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Keyboard, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AttendanceModal from '@/components/AttendanceModal';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { BADGES } from '@/constants/Badges';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { user, updateAvatar, updateProfile, logout } = useUser();



    // UI State
    const [isEditingProfile, setIsEditingProfile] = useState(false); // For details (Position, Foot, etc)
    const [isEditingName, setIsEditingName] = useState(false);       // For Name/Username
    const [isBadgePickerVisible, setIsBadgePickerVisible] = useState(false); // For Badge Selection
    const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState(false);

    // Edit Form State - Profile Details
    const [position, setPosition] = useState('');
    const [foot, setFoot] = useState('');
    const [level, setLevel] = useState('');
    const [age, setAge] = useState('');
    const [birthYear, setBirthYear] = useState('');

    // Edit Form State - Name
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState<'position' | 'foot' | 'level' | 'year' | null>(null);

    // Attendance Stats
    const [missedGamesCount, setMissedGamesCount] = useState(0);
    const [hasPenalty, setHasPenalty] = useState(false);

    React.useEffect(() => {
        if (user) {
            fetchAttendanceStats();
        }
    }, [user]);

    const fetchAttendanceStats = async () => {
        try {
            // Count total no_shows
            const { count, error } = await supabase
                .from('game_players')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user!.id)
                .eq('status', 'no_show');

            if (!error) {
                setMissedGamesCount(count || 0);
            }

            // Check for penalty (no_show in last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: recentNoShows, error: penaltyError } = await supabase
                .from('game_players')
                .select('game_id, games(date)')
                .eq('user_id', user!.id)
                .eq('status', 'no_show')
                .gt('created_at', sevenDaysAgo.toISOString()); // Assuming created_at roughly tracks when it happened, or better yet check game date?
            // The prompt says "se o organizador colocar que a pessoa faltou ... durante 7 dias".
            // Ideally we check if the GAME DATE was in the last 7 days.
            // But joining logic is complex here.
            // Let's rely on checking games where status is no_show, and join game date.

            const { data: penaltyData, error: penaltyDataError } = await supabase
                .from('game_players')
                .select(`
                    game_id,
                    games (
                        date
                    )
                `)
                .eq('user_id', user!.id)
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
            console.error('Error fetching attendance stats:', e);
        }
    };

    // --- Profile Details Logic ---
    const openProfileEditModal = () => {
        setPosition(user?.position || '');
        setFoot(user?.foot || '');
        setLevel(user?.level?.toString() || '');
        setAge(user?.age || '');
        // Try to reverse calc birth year if age exists, otherwise empty
        if (user?.age && !isNaN(parseInt(user.age))) {
            const currentYear = new Date().getFullYear();
            setBirthYear((currentYear - parseInt(user.age)).toString());
        } else {
            setBirthYear('');
        }
        setPickerVisible(false);
        setIsEditingProfile(true);
    };

    const handleSaveProfileDetails = () => {
        updateProfile({
            position,
            foot,
            level: parseInt(level) || 1,
            age
        });
        setIsEditingProfile(false);
    };

    // --- Name Edit Logic ---
    const openNameEditModal = () => {
        setName(user?.name || '');
        setUsername(user?.username || '');
        setIsEditingName(true);
    };

    const handleSaveName = () => {
        updateProfile({
            name,
            username
        });
        setIsEditingName(false);
    };

    // --- Badge Logic ---
    const handleSelectBadge = (badge: any) => {
        if (!badge.earned) {
            Alert.alert("Bloqueado", "Ainda não desbloqueaste esta medalha!");
            return;
        }
        updateProfile({ featuredBadgeId: badge.id });
        setIsBadgePickerVisible(false);
    };

    // --- Avatar Logic ---
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            updateAvatar(result.assets[0].uri);
        }
    };

    const renderAvatar = () => {
        if (user?.avatar) {
            return <Image source={{ uri: user.avatar }} style={styles.avatar} resizeMode="cover" />;
        }
        return (
            <View style={[styles.avatar, styles.defaultAvatar]}>
                <FontAwesome5 name="user" size={50} color="#fff" />
            </View>
        );
    };

    // --- Helpers ---
    const getLevelDescription = (lvl: number) => {
        if (lvl <= 3) return "Iniciante";
        if (lvl <= 7) return "Intermédio";
        return "Avançado";
    }

    const openPicker = (type: 'position' | 'foot' | 'level' | 'year') => {
        setPickerType(type);
        setPickerVisible(true);
    };

    const handleSelectOption = (option: string) => {
        if (pickerType === 'position') {
            setPosition(option);
        } else if (pickerType === 'foot') {
            setFoot(option);
        } else if (pickerType === 'level') {
            setLevel(option);
        } else if (pickerType === 'year') {
            setBirthYear(option);
            const currentYear = new Date().getFullYear();
            setAge((currentYear - parseInt(option)).toString());
        }
        setPickerVisible(false); // Go back to form
    };

    const generateYears = () => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: currentYear - 1950 + 1 }, (_, i) => (currentYear - i).toString());
    };

    const handleCloseProfileModal = () => {
        if (pickerVisible) {
            setPickerVisible(false);
        } else {
            setIsEditingProfile(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Terminar Sessão",
            "Tens a certeza que queres sair?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sair",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/'); // Ensure navigation to login/welcome
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                {/* Header Section */}
                <View style={styles.header}>
                    {hasPenalty && (
                        <View style={styles.penaltyBanner}>
                            <FontAwesome5 name="exclamation-circle" size={16} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.penaltyBannerText}>Faltou Recentemente</Text>
                        </View>
                    )}

                    <TouchableOpacity style={[styles.avatarContainer, hasPenalty && styles.penaltyAvatarBorder]} onPress={pickImage}>
                        {renderAvatar()}
                        <View style={styles.editBadge}>
                            <FontAwesome5 name="camera" size={12} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>Nível {user?.level || 1}</Text>
                    </View>

                    {/* Updated Name Layout */}
                    <View style={styles.nameContainer}>
                        <View style={styles.nameWrapper}>
                            <Text style={styles.name}>{user?.name || 'Utilizador'}</Text>
                            <TouchableOpacity style={styles.editNameButton} onPress={openNameEditModal}>
                                <FontAwesome5 name="pencil-alt" size={14} color="#4CAF50" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.username}>{user?.username || '@utilizador'}</Text>

                    <View style={styles.ratingContainer}>
                        <View style={{ flexDirection: 'row', marginRight: 5 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesome
                                    key={star}
                                    name="star"
                                    size={16}
                                    color={star <= (user?.rating || 0) ? "#FFD700" : "#E0E0E0"}
                                    style={{ marginHorizontal: 1 }}
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingCount}>({user?.ratingCount || 0} avaliações)</Text>
                    </View>
                </View>

                {/* Stats Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
                            <Ionicons name="football" size={24} color="#4CAF50" />
                        </View>
                        <Text style={styles.statValue}>{user?.gamesPlayed || 0}</Text>
                        <Text style={styles.statLabel}>Jogos</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <TouchableOpacity style={styles.statItem} onPress={() => setIsBadgePickerVisible(true)}>
                        <View style={[styles.iconCircle, { backgroundColor: '#fff8e1' }]}>
                            {user?.featuredBadgeId ? (
                                (() => {
                                    const badge = BADGES.find(b => b.id === user.featuredBadgeId);
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
                        {user?.featuredBadgeId ? (
                            <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 2 }}>
                                {BADGES?.find(b => b.id === user.featuredBadgeId)?.name || 'Conquistas'}
                            </Text>
                        ) : (
                            <Text style={styles.statValue}>Conquistas</Text>
                        )}
                        {!user?.featuredBadgeId && (
                            <Text style={styles.statLabel}>Ver todas</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.statDivider} />



                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => setIsAttendanceModalVisible(true)}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                            <MaterialCommunityIcons name="calendar-check" size={24} color="#2196F3" />
                        </View>
                        <Text style={styles.statValue}>{user?.attendance || '-'}</Text>
                        <Text style={styles.statLabel}>Assiduidade</Text>
                    </TouchableOpacity>
                </View>

                <AttendanceModal
                    visible={isAttendanceModalVisible}
                    onClose={() => setIsAttendanceModalVisible(false)}
                    attendance={user?.attendance || '-'}
                />

                {/* Player Details */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Perfil de Jogador</Text>
                        <TouchableOpacity onPress={openProfileEditModal} style={styles.editIcon}>
                            <FontAwesome5 name="pencil-alt" size={16} color="#4CAF50" />
                        </TouchableOpacity>
                    </View>

                    {/* Details Rows (Same as before) */}
                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="shirt-outline" size={20} color="#666" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Posição preferida:</Text>
                            <Text style={styles.detailValue}>{user?.position || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <MaterialCommunityIcons name="shoe-print" size={20} color="#666" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Pé dominante:</Text>
                            <Text style={styles.detailValue}>{user?.foot || '-'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="stats-chart" size={20} color="#666" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Nível:</Text>
                            <Text style={styles.detailValue}>{getLevelDescription(user?.level || 1)} ({user?.level || 1})</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                            <FontAwesome name="calendar" size={20} color="#666" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Idade:</Text>
                            <Text style={styles.detailValue}>{user?.age || '-'}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={[styles.sectionContainer, { marginTop: 20 }]}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => alert('Definições: Em breve')}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.actionIcon, { backgroundColor: '#F5F5F5' }]}>
                                <FontAwesome5 name="cog" size={16} color="#666" />
                            </View>
                            <Text style={styles.actionText}>Definições</Text>
                        </View>
                        <FontAwesome5 name="chevron-right" size={14} color="#ccc" />
                    </TouchableOpacity>

                    <View style={styles.actionDivider} />

                    <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.actionIcon, { backgroundColor: '#FFEBEE' }]}>
                                <FontAwesome5 name="sign-out-alt" size={16} color="#F44336" />
                            </View>
                            <Text style={[styles.actionText, { color: '#F44336' }]}>Terminar Sessão</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Extra space for floating nav */}
                <View style={{ height: 100 }} />

            </ScrollView>

            {/* --- NAME EDIT MODAL --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isEditingName}
                onRequestClose={() => setIsEditingName(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                            <Text style={styles.modalTitle}>Editar Nome</Text>

                            <Text style={styles.inputLabel}>Nome</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="O teu nome"
                                placeholderTextColor="#999"
                            />

                            <Text style={styles.inputLabel}>Nome de Utilizador (@)</Text>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={(text) => {
                                    const cleanText = text.replace(/\s/g, '');
                                    if (cleanText.length > 0 && !cleanText.startsWith('@')) {
                                        setUsername('@' + cleanText);
                                    } else {
                                        setUsername(cleanText);
                                    }
                                }}
                                placeholder="@omeunickname"
                                placeholderTextColor="#999"
                                autoCapitalize="none"
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setIsEditingName(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={handleSaveName}
                                >
                                    <Text style={styles.saveButtonText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* --- PROFILE DETAILS MODAL (Single Modal Architecture) --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isEditingProfile}
                onRequestClose={handleCloseProfileModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>

                        {!pickerVisible ? (
                            // --- MAIN FORM VIEW ---
                            <>
                                <Text style={styles.modalTitle}>Editar Perfil</Text>

                                <Text style={styles.inputLabel}>Posição Preferida</Text>
                                <TouchableOpacity
                                    style={styles.selectInput}
                                    onPress={() => openPicker('position')}
                                >
                                    <Text style={[styles.inputText, !position && styles.placeholderText]}>{position || 'Selecionar posição'}</Text>
                                    <FontAwesome5 name="chevron-down" size={12} color="#999" />
                                </TouchableOpacity>

                                <Text style={styles.inputLabel}>Pé Dominante</Text>
                                <TouchableOpacity
                                    style={styles.selectInput}
                                    onPress={() => openPicker('foot')}
                                >
                                    <Text style={[styles.inputText, !foot && styles.placeholderText]}>{foot || 'Selecionar pé'}</Text>
                                    <FontAwesome5 name="chevron-down" size={12} color="#999" />
                                </TouchableOpacity>

                                <Text style={styles.inputLabel}>Nível (1-10)</Text>
                                <TouchableOpacity
                                    style={styles.selectInput}
                                    onPress={() => openPicker('level')}
                                >
                                    <Text style={[styles.inputText, !level && styles.placeholderText]}>{level || '1'}</Text>
                                    <FontAwesome5 name="chevron-down" size={12} color="#999" />
                                </TouchableOpacity>

                                <Text style={styles.inputLabel}>Ano de Nascimento (Idade: {age})</Text>
                                <TouchableOpacity
                                    style={styles.selectInput}
                                    onPress={() => openPicker('year')}
                                >
                                    <Text style={[styles.inputText, !birthYear && styles.placeholderText]}>
                                        {birthYear || 'Selecionar ano'}
                                    </Text>
                                    <FontAwesome5 name="calendar-alt" size={12} color="#999" />
                                </TouchableOpacity>

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setIsEditingProfile(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.saveButton]}
                                        onPress={handleSaveProfileDetails}
                                    >
                                        <Text style={styles.saveButtonText}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            // --- PICKER VIEW (Inside same modal) ---
                            <View>
                                <Text style={styles.pickerTitle}>
                                    Selecione {
                                        pickerType === 'position' ? 'a Posição' :
                                            pickerType === 'foot' ? 'o Pé Dominante' :
                                                pickerType === 'level' ? 'o Nível' : 'o Ano de Nascimento'
                                    }
                                </Text>

                                <ScrollView style={{ maxHeight: 300 }}>
                                    {pickerType === 'position' && (
                                        ['Guarda-Redes', 'Defesa', 'Médio', 'Avançado'].map((opt) => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={styles.pickerOption}
                                                onPress={() => handleSelectOption(opt)}
                                            >
                                                <Text style={[styles.pickerOptionText, position === opt && styles.pickerOptionTextSelected]}>{opt}</Text>
                                                {position === opt && <FontAwesome5 name="check" size={14} color="#4CAF50" />}
                                            </TouchableOpacity>
                                        ))
                                    )}
                                    {pickerType === 'foot' && (
                                        ['Esquerdo', 'Direito'].map((opt) => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={styles.pickerOption}
                                                onPress={() => handleSelectOption(opt)}
                                            >
                                                <Text style={[styles.pickerOptionText, foot === opt && styles.pickerOptionTextSelected]}>{opt}</Text>
                                                {foot === opt && <FontAwesome5 name="check" size={14} color="#4CAF50" />}
                                            </TouchableOpacity>
                                        ))
                                    )}
                                    {pickerType === 'level' && (
                                        Array.from({ length: 10 }, (_, i) => (i + 1).toString()).map((opt) => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={styles.pickerOption}
                                                onPress={() => handleSelectOption(opt)}
                                            >
                                                <Text style={[styles.pickerOptionText, level === opt && styles.pickerOptionTextSelected]}>{opt} - {getLevelDescription(parseInt(opt))}</Text>
                                                {level === opt && <FontAwesome5 name="check" size={14} color="#4CAF50" />}
                                            </TouchableOpacity>
                                        ))
                                    )}
                                    {pickerType === 'year' && (
                                        generateYears().map((opt) => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={styles.pickerOption}
                                                onPress={() => handleSelectOption(opt)}
                                            >
                                                <Text style={[styles.pickerOptionText, birthYear === opt && styles.pickerOptionTextSelected]}>{opt}</Text>
                                                {birthYear === opt && <FontAwesome5 name="check" size={14} color="#4CAF50" />}
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </ScrollView>

                                <TouchableOpacity style={styles.pickerCloseButton} onPress={() => setPickerVisible(false)}>
                                    <FontAwesome5 name="arrow-left" size={16} color="#666" style={{ marginRight: 8 }} />
                                    <Text style={styles.pickerCloseText}>Voltar</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                    </View>
                </View>
            </Modal>
            {/* --- BADGE PICKER MODAL --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isBadgePickerVisible}
                onRequestClose={() => setIsBadgePickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <Text style={styles.modalTitle}>Escolher Medalha</Text>
                            <TouchableOpacity onPress={() => setIsBadgePickerVisible(false)}>
                                <FontAwesome5 name="times" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
                            Escolhe uma medalha para exibir no teu perfil.
                        </Text>

                        <ScrollView>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                {BADGES.map((badge) => (
                                    <TouchableOpacity
                                        key={badge.id}
                                        style={{ width: '30%', alignItems: 'center', marginBottom: 20, opacity: badge.earned ? 1 : 0.5 }}
                                        onPress={() => handleSelectBadge(badge)}
                                        disabled={!badge.earned}
                                    >
                                        <View style={{
                                            width: 60, height: 60, borderRadius: 30,
                                            backgroundColor: badge.earned ? badge.color + '20' : '#eee',
                                            justifyContent: 'center', alignItems: 'center', marginBottom: 5,
                                            borderWidth: user?.featuredBadgeId === badge.id ? 2 : 0,
                                            borderColor: badge.color
                                        }}>
                                            <FontAwesome5 name={badge.icon} size={24} color={badge.earned ? badge.color : '#ccc'} />
                                        </View>
                                        <Text style={{ fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>{badge.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={{ alignSelf: 'center', marginTop: 10, padding: 10 }}
                            onPress={() => {
                                setIsBadgePickerVisible(false);
                                router.push('/badges');
                            }}
                        >
                            <Text style={{ color: themeColors.primary, fontWeight: 'bold' }}>Ver Progresso Detalhado</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        alignItems: 'center',
        paddingTop: 20,
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
    onlineBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#f2f2f2',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
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
    // Updated Name Styles
    nameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    nameWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        // Make sure it doesn't span full width unless needed, so absolute positioning works relative to text width
        alignSelf: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    editNameButton: {
        position: 'absolute',
        right: -24, // Push to right of text
        padding: 4,
        top: 6, // Vertical center approx (adjust based on font size/line height)
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
    editIcon: {
        padding: 5,
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
        marginLeft: 2,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        fontSize: 14,
    },
    selectInput: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputText: {
        fontSize: 14,
        color: '#333',
    },
    placeholderText: {
        color: '#999',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#f2f2f2',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // Picker Styles (Modified for inline)
    pickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    pickerOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f2f2',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerOptionText: {
        fontSize: 16,
        color: '#333',
    },
    pickerOptionTextSelected: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    pickerCloseButton: {
        marginTop: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
    },
    pickerCloseText: {
        color: '#666',
        fontSize: 14,
    },
    penaltyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F44336',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 15,
        shadowColor: '#F44336',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    penaltyBannerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    penaltyAvatarBorder: {
        borderWidth: 3,
        borderColor: '#F44336',
        borderRadius: 55, // slightly larger than avatar
        padding: 2,
    },
    // Action Button Styles
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
    },
    actionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    actionText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    actionDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 47, // Align with text (32 icon + 15 margin)
    },
});
