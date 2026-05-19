import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  ListRenderItemInfo,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

const C = {
  bg: '#140102',
  surface: 'rgba(255,255,255,0.06)',
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.6)',
  whiteFaint: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.1)',
  inputBg: 'rgba(255,255,255,0.08)',
  placeholder: 'rgba(255,255,255,0.35)',
};

const MONO = 'Courier';

type UserResult = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

function UserRow({ item, onPress }: { item: UserResult; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.userRow, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      {item.avatar_url ? (
        <ExpoImage
          source={item.avatar_url}
          style={styles.userAvatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
          <Ionicons name="person-outline" size={18} color={C.whiteFaint} />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userUsername}>@{item.username}</Text>
        {item.full_name ? (
          <Text style={styles.userFullName} numberOfLines={1}>{item.full_name}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.whiteFaint} />
    </Pressable>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${text.trim()}%`)
        .limit(25);
      setResults(data ?? []);
      setLoading(false);
    }, 300);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const renderItem = ({ item }: ListRenderItemInfo<UserResult>) => (
    <UserRow
      item={item}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id, username: item.username })}
    />
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.accentBar} />
        <Text style={styles.headerTitle}>RECHERCHE</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={C.placeholder} />
        <TextInput
          style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
          value={query}
          onChangeText={handleSearch}
          placeholder="Rechercher un utilisateur…"
          placeholderTextColor={C.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={C.accent}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={C.whiteFaint} />
          </Pressable>
        )}
      </View>

      {loading && (
        <ActivityIndicator color={C.accent} style={{ marginTop: 24 }} />
      )}

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loading && query.length >= 2 ? (
            <View style={styles.empty}>
              <Ionicons name="person-outline" size={44} color={C.whiteFaint} />
              <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
              <Text style={styles.emptyHint}>Essaie un autre nom d'utilisateur</Text>
            </View>
          ) : !loading && query.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={44} color={C.whiteFaint} />
              <Text style={styles.emptyText}>Trouve des passionnés</Text>
              <Text style={styles.emptyHint}>Saisis au moins 2 caractères</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  accentBar: {
    width: 3,
    height: 16,
    borderRadius: 1.5,
    backgroundColor: C.accent,
  },
  headerTitle: {
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: 2,
    color: C.white,
    fontWeight: '700',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: C.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    color: C.white,
    fontSize: 14,
    fontWeight: '500',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface,
  },
  userAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  userFullName: {
    fontFamily: MONO,
    fontSize: 11,
    color: C.whiteSoft,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.whiteSoft,
  },
  emptyHint: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 0.5,
    color: C.whiteFaint,
  },
});
