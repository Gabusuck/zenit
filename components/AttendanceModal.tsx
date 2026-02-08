import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface AttendanceModalProps {
    visible: boolean;
    onClose: () => void;
    attendance: string; // e.g., "85%" or "-"
}

export default function AttendanceModal({ visible, onClose, attendance }: AttendanceModalProps) {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    // Parse percentage
    const percentage = attendance === '-' ? 0 : parseInt(attendance.replace('%', ''), 10);

    // Determine color based on percentage
    let color = '#F44336'; // Red (< 50%)
    if (percentage >= 80) color = '#4CAF50'; // Green
    else if (percentage >= 50) color = '#FFC107'; // Yellow/Orange

    // Circular Progress Params
    const size = 150;
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = percentage / 100;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <FontAwesome5 name="times" size={20} color="#999" />
                            </TouchableOpacity>

                            <Text style={styles.modalTitle}>Assiduidade</Text>

                            <View style={styles.progressContainer}>
                                <Svg width={size} height={size}>
                                    {/* Background Circle */}
                                    <Circle
                                        stroke="#f0f0f0"
                                        fill="none"
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        strokeWidth={strokeWidth}
                                    />
                                    {/* Progress Circle */}
                                    <Circle
                                        stroke={color}
                                        fill="none"
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={`${circumference} ${circumference}`}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                    />
                                </Svg>
                                <View style={styles.progressTextContainer}>
                                    <Text style={[styles.progressText, { color }]}>
                                        {attendance === '-' ? '-' : `${percentage}%`}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.explanationText}>
                                Probabilidade de o jogador aparecer no evento.
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 5,
        zIndex: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 25,
    },
    progressContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
    },
    progressTextContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    explanationText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
});
