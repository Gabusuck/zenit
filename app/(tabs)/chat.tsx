
import { FontAwesome } from '@expo/vector-icons';
import { FlatList, Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const DATA = [
  {
    id: '1',
    name: 'Miguel Pais',
    status: 'online',
    message: 'Vem peladinha hoje?',
    time: '18:20',
    unread: 2,
    isOnline: true,
  },
  {
    id: '2',
    name: 'João Oliveira',
    status: 'Disponível',
    message: 'Não tens noção de como estão as minhas pernas...',
    time: '15:30',
    unread: 1,
    isOnline: false,
  },
  {
    id: '3',
    name: 'Pedro Coelho',
    status: 'online',
    message: 'Eu: Sim, tá tudo marcado!',
    time: '15:30',
    unread: 0,
    isOnline: true,
    muted: true,
  },
  {
    id: '4',
    name: 'Paulo Cardoso',
    status: 'a escrever...',
    message: 'Tudo pronto para hoje?',
    time: '15:20',
    unread: 0,
    isOnline: true,
  },
  {
    id: '5',
    name: 'Carlos',
    status: 'Visto há 34min',
    message: 'Ya',
    time: '15:04',
    unread: 0,
    isOnline: false,
  },
  {
    id: '6',
    name: 'Mateus Trindade',
    status: 'Visto há 1h',
    message: 'Vem, tranquilo...',
    time: '14:38',
    unread: 0,
    isOnline: false,
  },
];

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.chatItem}>
      <View style={styles.avatarContainer}>
        {/* Placeholder Avatar */}
        <View style={[styles.avatar, { backgroundColor: '#ddd' }]}>
          <Image
            source={{ uri: `https://randomuser.me/api/portraits/men/${item.id}.jpg` }}
            style={styles.avatarImage}
          />
        </View>
        {item.isOnline && <View style={styles.onlineBadge} />}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={[
            styles.statusText,
            item.status === 'online' ? { color: themeColors.primary } : {}
          ]}>
            {item.status}
          </Text>
        </View>

        <Text style={styles.lastMessage} numberOfLines={1} ellipsizeMode="tail">
          {item.message}
        </Text>
      </View>

      <View style={styles.rightActions}>
        {item.unread > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
        {item.muted && (
          <FontAwesome name="bell-slash" size={14} color="#999" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f2f2f2' }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logoText}>Zenit</Text>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Chat"
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2196F3',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
    backgroundColor: '#f2f2f2', // Match screen background or white? Mockup looks like transparent/white rows. Let's keep transparent/bg.
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50', // Green
    borderWidth: 2,
    borderColor: '#f2f2f2',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  statusRow: {
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50', // Default to green for 'online', styled dynamically
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#777',
  },
  rightActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 20,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  unreadText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
});
