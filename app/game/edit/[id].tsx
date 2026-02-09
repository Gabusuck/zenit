
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

export default function EditGameScreen() {
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { user } = useUser();

    const [location, setLocation] = useState('');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [price, setPrice] = useState('');
    const [totalSlots, setTotalSlots] = useState('10');
    const [filledSlots, setFilledSlots] = useState(0); // Track filled slots for validation
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGameDetails();
    }, [id]);

    const fetchGameDetails = async () => {
        if (!id) return;

        try {
            const { data, error } = await supabase
                .from('games')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching game details:', error);
                alert('Erro ao carregar detalhes do jogo.');
                router.back();
            } else {
                // Populate state
                setLocation(data.location);
                setPrice(data.price.toString());
                setTotalSlots(data.total_slots.toString());
                setFilledSlots(data.filled_slots);
                setDescription(data.description || '');
                setIsPrivate(data.is_private || false);
                setPassword(data.password || '');

                // Parse Date and Time
                if (data.date) {
                    const [day, month, year] = data.date.split('/').map(Number);
                    setDate(new Date(year, month - 1, day));
                }

                if (data.time) {
                    const [hours, minutes] = data.time.split(':').map(Number);
                    const newTime = new Date();
                    newTime.setHours(hours, minutes);
                    setTime(newTime);
                }
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGame = async () => {
        if (!location || !price || !totalSlots) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (isPrivate && !password) {
            alert('Jogos privados requerem uma palavra-passe.');
            return;
        }

        if (!user) {
            alert('Precisa de estar logado.');
            return;
        }

        const newTotalSlots = parseInt(totalSlots);
        if (newTotalSlots < filledSlots) {
            alert(`Não pode reduzir as vagas para menos de ${filledSlots} (jogadores inscritos).`);
            return;
        }

        setIsSubmitting(true);

        const formattedDate = date.toLocaleDateString('pt-PT');
        const formattedTime = time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

        try {
            const { error } = await supabase
                .from('games')
                .update({
                    location: location,
                    date: formattedDate,
                    time: formattedTime,
                    price: parseFloat(price.replace(',', '.')),
                    total_slots: newTotalSlots,
                    description: description,
                    is_private: isPrivate,
                    password: isPrivate ? password : null
                })
                .eq('id', id);

            if (error) {
                console.error('Error updating game:', error);
                alert('Erro ao atualizar o jogo.');
            } else {
                alert('Jogo atualizado com sucesso! ⚽');
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

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
            <Stack.Screen options={{
                title: 'Editar Jogo',
                headerStyle: { backgroundColor: themeColors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                ),
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

                    {/* Private Game Toggle */}
                    <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FontAwesome5 name="lock" size={18} color="#666" style={{ marginRight: 10 }} />
                            <Text style={styles.label}>Jogo Privado</Text>
                        </View>
                        <Switch
                            value={isPrivate}
                            onValueChange={setIsPrivate}
                            trackColor={{ false: "#767577", true: themeColors.primary }}
                            thumbColor={isPrivate ? "#fff" : "#f4f3f4"}
                        />
                    </View>

                    {/* Password Input (Conditional) */}
                    {isPrivate && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Palavra-passe <Text style={{ color: 'red' }}>*</Text></Text>
                            <View style={styles.inputContainer}>
                                <FontAwesome5 name="key" size={18} color="#666" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Defina uma palavra-passe"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: themeColors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
                        onPress={handleUpdateGame}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <FontAwesome5 name="save" size={24} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.submitButtonText}>Guardar Alterações</Text>
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
