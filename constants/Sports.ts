import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export const SPORTS = [
    { id: 'futebol', name: 'Futebol', icon: 'futbol', library: FontAwesome5, color: '#4CAF50' },
    { id: 'padel', name: 'Padel', icon: 'tennis', library: MaterialCommunityIcons, color: '#2196F3' },
    { id: 'tenis', name: 'Ténis', icon: 'tennis-ball', library: MaterialCommunityIcons, color: '#E91E63' },
    { id: 'basquetebol', name: 'Basquetebol', icon: 'basketball-ball', library: FontAwesome5, color: '#FF5722' },
];

export const getSportByName = (name: string | null) => {
    if (!name) return null;
    return SPORTS.find(s => s.name === name);
};
