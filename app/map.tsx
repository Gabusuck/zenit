
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getSportByName } from '@/constants/Sports';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

export interface Venue {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    sport: string;
}

export default function MapScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const { selectedSport } = useUser();

    // Default region (Lisbon)
    const [region, setRegion] = useState({
        latitude: 38.7223,
        longitude: -9.1393,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        (async () => {
            // Request location permissions
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            setPermissionGranted(true);

            // Get current location
            let location = await Location.getCurrentPositionAsync({});
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
        })();

        fetchVenues();
    }, []);

    const fetchVenues = async () => {
        try {
            const { data, error } = await supabase
                .from('venues')
                .select('*');

            if (error) {
                console.error('Error fetching venues:', error);
            } else {
                const formattedVenues: Venue[] = (data || []).map((v: any) => ({
                    ...v,
                    latitude: Number(v.latitude),
                    longitude: Number(v.longitude),
                }));
                setVenues(formattedVenues);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCalloutPress = (venueId: string) => {
        router.push(`/venue/${venueId}` as any);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Campos de Futebol',
                headerStyle: { backgroundColor: themeColors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <FontAwesome5 name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                ),
            }} />

            <MapView
                style={styles.map}
                region={region}
                showsUserLocation={permissionGranted}
                showsMyLocationButton={true}
            >
                {venues
                    .filter((venue) => !selectedSport || venue.sport === selectedSport)
                    .map((venue) => {
                        const sport = getSportByName(venue.sport);
                        const pinColor = sport ? sport.color : themeColors.primary;

                        return (
                            <Marker
                                key={venue.id}
                                coordinate={{
                                    latitude: Number(venue.latitude),
                                    longitude: Number(venue.longitude),
                                }}
                                pinColor={pinColor}
                                onCalloutPress={() => handleCalloutPress(venue.id)}
                            >
                                <Callout tooltip>
                                    <View style={styles.calloutContainer}>
                                        <Text style={styles.calloutTitle}>{venue.name}</Text>
                                        <Text style={styles.calloutAddress}>{venue.address}</Text>
                                        <View style={styles.calloutButton}>
                                            <Text style={{ color: '#fff', fontSize: 12 }}>Ver Detalhes</Text>
                                        </View>
                                    </View>
                                </Callout>
                            </Marker>
                        );
                    })}
            </MapView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    calloutContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        width: 200,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    calloutTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 5,
    },
    calloutAddress: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    calloutButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
});
