
import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Keyboard, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { user, updateAvatar, updateProfile } = useUser();

    // UI State
    const [isEditingProfile, setIsEditingProfile] = useState(false); // For details (Position, Foot, etc)
    const [isEditingName, setIsEditingName] = useState(false);       // For Name/Username

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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#f2f2f2' }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                {/* Header Section */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
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

                    <TouchableOpacity style={styles.statItem} onPress={() => router.push('/badges')}>
                        <View style={[styles.iconCircle, { backgroundColor: '#fff8e1' }]}>
                            <FontAwesome5 name="trophy" size={20} color="#FFC107" />
                        </View>
                        <Text style={styles.statValue}>Conquistas</Text>
                        <Text style={styles.statLabel}>Ver todas</Text>
                    </TouchableOpacity>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                            <MaterialCommunityIcons name="clock-time-four-outline" size={24} color="#2196F3" />
                        </View>
                        <Text style={styles.statValue}>{user?.punctuality || '-'}</Text>
                        <Text style={styles.statLabel}>Pontualidade</Text>
                    </View>
                </View>

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
                                onChangeText={setUsername}
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
        borderColor: '#f2f2f2',
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
        color: '#999',
        marginBottom: 10,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingCount: {
        fontSize: 12,
        color: '#999',
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
    }
});
