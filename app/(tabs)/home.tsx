
import { FontAwesome } from '@expo/vector-icons';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/context/UserContext';

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { user } = useUser();
  const [games, setGames] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching games:', error);
      } else {
        setGames(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching games:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGames();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGames();
    }, [])
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/game/${item.id}`)}
    >
      <View style={[styles.cardHeader, { backgroundColor: 'transparent' }]}>
        <Text style={styles.cardTitle}>{item.location}</Text>
        <FontAwesome name="soccer-ball-o" size={16} color="#000" />
      </View>

      <Text style={styles.cardTime}>{item.date} às {item.time ? item.time.slice(0, 5) : ''}</Text>
      <Text style={[styles.cardSlots, { color: themeColors.primary }]}>{item.filled_slots} / {item.total_slots} Vagas Preenchidas</Text>
      <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>Presença: {item.price}€</Text>

      <View style={styles.cardFooter}>
        {/* Avatars Section - Mocked for now until we have constraints/joins */}
        <View style={styles.avatarContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* For now, just show a placeholder since we don't have participants table yet */}
            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0', borderWidth: 0 }]}>
              <FontAwesome name="user" size={12} color="#999" />
            </View>
            <Text style={styles.slotsText}>{item.filled_slots} jogadores</Text>
          </View>
        </View>

        {/* Join Button */}
        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: themeColors.primary }]}
          onPress={() => router.push(`/game/${item.id}`)}
        >
          <Text style={styles.joinButtonText}>Juntar-me</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const Header = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.logoText}>Zenit</Text>
      <Text style={styles.welcomeText}>Olá {user?.name || 'Visitante'}, pronto para jogar?</Text>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: themeColors.primary }]}
        onPress={() => router.push('/create-game')}
      >
        <FontAwesome name="plus-circle" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={styles.createButtonText}>Criar Jogo</Text>
      </TouchableOpacity>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={[styles.actionButton, { borderColor: themeColors.primary, borderWidth: 1 }]}>
          <FontAwesome name="list" size={16} color={themeColors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.actionButtonText, { color: themeColors.primary }]}>Meus Jogos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#1b5e20' }]}>
          <FontAwesome name="search" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>Encontrar Jogos</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Jogos Perto de Ti</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f2f2f2' }]} edges={['top']}>
      <FlatList
        data={games}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={<Header />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ color: '#999' }}>Ainda não há jogos criados.</Text>
            <Text style={{ color: '#999', fontSize: 12 }}>Sê o primeiro a criar um!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100, // Space for floating tab bar
  },
  headerContainer: {
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2196F3', // Blue color for Zenit logo as in mockup
    marginBottom: 5,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: '600',
  },
  createButton: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
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
