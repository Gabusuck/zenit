import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SPORTS } from '@/constants/Sports';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function CreateVenueScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { user } = useUser();

    const [loading, setLoading] = useState(false);
    const [initialRegion, setInitialRegion] = useState({
        latitude: 38.7223,
        longitude: -9.1393,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [selectedSport, setSelectedSport] = useState<string | null>(null);
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Precisamos da tua localização para mostrar o mapa.');
                return;
            }
            setPermissionGranted(true);

            let location = await Location.getCurrentPositionAsync({});
            const region = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            setInitialRegion(region);

            // Auto-select current location initially
            setSelectedLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        })();
    }, []);

    const handleMapPress = (e: any) => {
        setSelectedLocation(e.nativeEvent.coordinate);
    };

    const handleSave = async () => {
        if (!user) {
            Alert.alert('Erro', 'Tens de estar autenticado para criar um campo.');
            return;
        }

        if (!name) {
            Alert.alert('Erro', 'Por favor insere o nome do campo.');
            return;
        }
        if (!selectedLocation) {
            Alert.alert('Erro', 'Por favor seleciona a localização no mapa.');
            return;
        }
        if (!selectedSport) {
            Alert.alert('Erro', 'Por favor seleciona a modalidade principal.');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('venues')
                .insert({
                    name: name,
                    address: address || 'Sem morada',
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    created_by: user?.id,
                    sport: selectedSport // Save selected sport
                })
                .select()
                .single();

            if (error) throw error;

            Alert.alert('Sucesso', 'Campo adicionado com sucesso!');
            router.back();
        } catch (error: any) {
            console.error('Error saving venue:', error);
            Alert.alert('Erro', 'Não foi possível guardar o campo: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Adicionar Campo',
                headerStyle: { backgroundColor: themeColors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <FontAwesome5 name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                ),
            }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1 }}>
                    {/* Map Section */}
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={initialRegion}
                            showsUserLocation={permissionGranted}
                            showsMyLocationButton={true}
                            onPress={handleMapPress}
                        >
                            {selectedLocation && (
                                <Marker
                                    coordinate={selectedLocation}
                                    title="Novo Campo"
                                    pinColor={themeColors.primary}
                                />
                            )}
                        </MapView>

                        <View style={styles.mapOverlay}>
                            <Text style={styles.mapInstruction}>Toque no mapa para definir a localização</Text>
                        </View>
                    </View>

                    {/* Form Section */}
                    <ScrollView style={styles.formContainer} contentContainerStyle={{ padding: 20 }}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome do Campo <Text style={{ color: 'red' }}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Campo das Amoreiras"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Morada (Opcional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Rua, Cidade..."
                                value={address}
                                onChangeText={setAddress}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Modalidade Principal <Text style={{ color: 'red' }}>*</Text></Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                {SPORTS.map((sport) => (
                                    <TouchableOpacity
                                        key={sport.id}
                                        style={[
                                            styles.sportChip,
                                            selectedSport === sport.name && { backgroundColor: sport.color, borderColor: sport.color }
                                        ]}
                                        onPress={() => setSelectedSport(sport.name)}
                                    >
                                        <sport.library
                                            name={sport.icon as any}
                                            size={16}
                                            color={selectedSport === sport.name ? '#fff' : '#666'}
                                            style={{ marginRight: 5 }}
                                        />
                                        <Text style={[
                                            styles.sportChipText,
                                            selectedSport === sport.name && { color: '#fff', fontWeight: 'bold' }
                                        ]}>
                                            {sport.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Guardar Campo</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapContainer: {
        height: '50%',
        width: '100%',
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapOverlay: {
        position: 'absolute',
        top: 20,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    mapInstruction: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    formContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        marginTop: -20, // Overlap map slightly
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    saveButton: {
        padding: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sportChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    sportChipText: {
        fontSize: 14,
        color: '#666',
    },
});
