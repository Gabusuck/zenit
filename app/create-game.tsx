
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

export default function CreateGameScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { user } = useUser();

    const [location, setLocation] = useState('');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [price, setPrice] = useState('');
    const [totalSlots, setTotalSlots] = useState('10');
    const [description, setDescription] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateGame = async () => {
        if (!location || !price || !totalSlots) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (!user) {
            alert('Precisa de estar logado para criar um jogo.');
            return;
        }

        setIsSubmitting(true);

        const formattedDate = date.toLocaleDateString('pt-PT');
        const formattedTime = time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

        try {
            const { error } = await supabase
                .from('games')
                .insert({
                    created_by: user.id,
                    location: location,
                    date: formattedDate,
                    time: formattedTime,
                    price: parseFloat(price.replace(',', '.')),
                    total_slots: parseInt(totalSlots),
                    filled_slots: 1, // Creator automatically joins? For now lets say yes or just 0
                    description: description
                });

            if (error) {
                console.error('Error creating game:', error);
                alert('Erro ao criar o jogo. Tente novamente.');
            } else {
                alert('Jogo criado com sucesso! ⚽');
                router.back();
            }
        } catch (e) {
            console.error('Unexpected error:', e);
            alert('Ocorreu um erro inesperado.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleDatePicker = () => {
        setShowDatePicker(!showDatePicker);
    };

    const toggleTimePicker = () => {
        setShowTimePicker(!showTimePicker);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (event.type === 'set' || Platform.OS === 'ios') {
            const currentDate = selectedDate || date;
            setDate(currentDate);
        }

        if (Platform.OS === 'android') {
            toggleDatePicker();
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        if (event.type === 'set' || Platform.OS === 'ios') {
            const currentTime = selectedTime || time;
            setTime(currentTime);
        }

        if (Platform.OS === 'android') {
            toggleTimePicker();
        }
    };

    const confirmIOSDate = () => {
        toggleDatePicker();
    };

    const confirmIOSTime = () => {
        toggleTimePicker();
    };


    return (
        <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
            <Stack.Screen options={{
                title: 'Criar Jogo',
                headerStyle: { backgroundColor: themeColors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }} />
            <StatusBar style="light" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Location */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Localização <Text style={{ color: 'red' }}>*</Text></Text>
                        <View style={styles.inputContainer}>
                            <FontAwesome5 name="map-marker-alt" size={18} color="#666" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Campo de Pinheiro"
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>
                    </View>

                    {/* Date & Time Row */}
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Data <Text style={{ color: 'red' }}>*</Text></Text>
                            <TouchableOpacity style={styles.pickerButton} onPress={toggleDatePicker}>
                                <FontAwesome5 name="calendar-alt" size={18} color="#666" style={styles.icon} />
                                <Text style={styles.pickerText}>{date.toLocaleDateString('pt-PT')}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Hora <Text style={{ color: 'red' }}>*</Text></Text>
                            <TouchableOpacity style={styles.pickerButton} onPress={toggleTimePicker}>
                                <FontAwesome5 name="clock" size={18} color="#666" style={styles.icon} />
                                <Text style={styles.pickerText}>{time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Date Picker Modal/Component */}
                    {showDatePicker && (
                        Platform.OS === 'ios' ? (
                            <Modal transparent animationType="slide">
                                <View style={styles.modalContainer}>
                                    <View style={styles.modalContent}>
                                        <DateTimePicker
                                            value={date}
                                            mode="date"
                                            display="spinner"
                                            onChange={onDateChange}
                                            style={styles.datePicker}
                                            textColor="black"
                                            minimumDate={new Date()}
                                        />
                                        <TouchableOpacity style={[styles.confirmButton, { backgroundColor: themeColors.primary }]} onPress={confirmIOSDate}>
                                            <Text style={styles.confirmButtonText}>Confirmar Data</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Modal>
                        ) : (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                minimumDate={new Date()}
                            />
                        )
                    )}

                    {/* Time Picker Modal/Component */}
                    {showTimePicker && (
                        Platform.OS === 'ios' ? (
                            <Modal transparent animationType="slide">
                                <View style={styles.modalContainer}>
                                    <View style={styles.modalContent}>
                                        <DateTimePicker
                                            value={time}
                                            mode="time"
                                            display="spinner"
                                            onChange={onTimeChange}
                                            style={styles.datePicker}
                                            textColor="black"
                                        />
                                        <TouchableOpacity style={[styles.confirmButton, { backgroundColor: themeColors.primary }]} onPress={confirmIOSTime}>
                                            <Text style={styles.confirmButtonText}>Confirmar Hora</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Modal>
                        ) : (
                            <DateTimePicker
                                value={time}
                                mode="time"
                                display="default"
                                onChange={onTimeChange}
                            />
                        )
                    )}


                    {/* Price & Slots Row */}
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Preço (€) <Text style={{ color: 'red' }}>*</Text></Text>
                            <View style={styles.inputContainer}>
                                <FontAwesome5 name="euro-sign" size={18} color="#666" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: 5"
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Vagas Totais <Text style={{ color: 'red' }}>*</Text></Text>
                            <View style={styles.inputContainer}>
                                <FontAwesome5 name="users" size={18} color="#666" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: 10"
                                    value={totalSlots}
                                    onChangeText={setTotalSlots}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Descrição / Observações</Text>
                        <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
                            <FontAwesome5 name="align-left" size={18} color="#666" style={[styles.icon, { marginTop: 3 }]} />
                            <TextInput
                                style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                                placeholder="Detalhes extra (ex: coletes, bola, nível)..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: themeColors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
                        onPress={handleCreateGame}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="football-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.submitButtonText}>Criar Jogo</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    icon: {
        marginRight: 10,
        width: 20,
        textAlign: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    pickerText: {
        fontSize: 16,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    submitButton: {
        marginTop: 10,
        height: 55,
        borderRadius: 27.5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    datePicker: {
        width: '100%',
        height: 200,
    },
    confirmButton: {
        marginTop: 15,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
