import { useState, useCallback, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:       '#140102',
  dark:     '#140102',
  accent:   '#E50914',
  muted:    'rgba(255,255,255,0.45)',
  border:   'rgba(255,255,255,0.12)',
  inputBg:  '#1F0808',
  rowHover: '#2A0A0A',
  white:    '#FFFFFF',
  whiteSoft:'rgba(255,255,255,0.7)',
};

const PAD = 16;
const AVATAR = 46;

// ─── Type ─────────────────────────────────────────────────────────────────────

type UserResult = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

// ─── Row ──────────────────────────────────────────────────────────────────────

function UserRow({ item, onPress }: { item: UserResult; onPress: () => void }) {
  const initials = (item.username ?? '?').slice(0, 2).toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.rowHover }]}
      onPress={onPress}
    >
      {item.avatar_url ? (
        <ExpoImage
          source={item.avatar_url}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.username}>@{item.username}</Text>
        {item.full_name ? (
          <Text style={styles.fullName} numberOfLines={1}>{item.full_name}</Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={16} color={C.muted} />
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const navigation = useNavigation<any>();

  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${text.trim()}%`)
        .limit(25);
      setResults((data as UserResult[]) ?? []);
      setLoading(false);
    }, 300);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<UserResult>) => (
      <UserRow
        item={item}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id, username: item.username })}
      />
    ),
    [navigation]
  );

  const showResults = query.length >= 2;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Recherche</Text>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
          <Ionicons name="search" size={17} color={focused ? C.accent : C.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            value={query}
            onChangeText={handleSearch}
            placeholder="Rechercher un pilote..."
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={C.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Results / States ── */}
      {loading ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 28 }} />
      ) : showResults && results.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="person-outline" size={48} color={C.border} />
          <Text style={styles.emptyTitle}>Aucun pilote trouvé</Text>
          <Text style={styles.emptySubtitle}>Essaie un autre nom d'utilisateur</Text>
        </View>
      ) : !showResults ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={52} color={C.border} />
          <Text style={styles.emptyTitle}>Trouve des passionnés</Text>
          <Text style={styles.emptySubtitle}>Saisis au moins 2 caractères</Text>

          {/* Category pills */}
          <View style={styles.pills}>
            {['Track day', 'GT3', 'Alpine', 'Road trip', 'Build'].map((label) => (
              <Pressable
                key={label}
                style={({ pressed }) => [styles.pill, pressed && { opacity: 0.7 }]}
                onPress={() => handleSearch(label)}
              >
                <Text style={styles.pillText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => (
            <View style={styles.sep} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingHorizontal: PAD,
    paddingTop: 12,
    paddingBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
  },

  // Search
  searchWrap: { paddingHorizontal: PAD, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchBarFocused: { borderColor: C.accent, backgroundColor: '#2A0A0A' },
  searchInput: { flex: 1, fontSize: 15, color: C.white },

  // List
  list: { paddingHorizontal: PAD, paddingBottom: 32 },
  sep:  { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: PAD + AVATAR + 12 },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatar:        { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: C.border },
  avatarFallback:{ backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  avatarText:    { color: '#FFF', fontSize: 16, fontWeight: '700' },
  info:     { flex: 1, gap: 2 },
  username: { fontSize: 15, fontWeight: '700', color: C.white },
  fullName: { fontSize: 12, color: C.muted },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: C.white, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: C.muted, textAlign: 'center' },

  // Suggestion pills
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 20 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  pillText: { fontSize: 13, color: C.whiteSoft, fontWeight: '500' },
});
