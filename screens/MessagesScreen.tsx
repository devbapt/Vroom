import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  ListRenderItemInfo,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';
import {
  useConversations,
  findOrCreateConversation,
  type ConversationPreview,
  type ChatUser,
} from '../hooks/useMessages';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:       '#FFFFFF',
  dark:     '#121212',
  accent:   '#D91D2F',
  muted:    '#8E8E93',
  border:   '#F0F0F0',
  inputBg:  '#F7F7F7',
  rowHover: '#FAFAFA',
};

const PAD = 16;
const AVATAR_SIZE = 50;
const BADGE_SIZE  = 20;

type Tab = 'groupes' | 'prive';


// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7)   return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user }: { user: ChatUser }) {
  const initials = (user.username ?? '?').slice(0, 2).toUpperCase();
  if (user.avatar_url) {
    return (
      <ExpoImage
        source={user.avatar_url}
        style={styles.avatar}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// ─── Conversation row (real DMs) ──────────────────────────────────────────────

function ConvRow({ item, onPress }: { item: ConversationPreview; onPress: (c: ConversationPreview) => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.rowHover }]}
      onPress={() => onPress(item)}
    >
      <Avatar user={item.otherUser} />
      <View style={styles.rowCenter}>
        <Text style={[styles.rowName, item.unreadCount > 0 && styles.bold]} numberOfLines={1}>
          {item.otherUser.username ? `@${item.otherUser.username}` : 'Utilisateur inconnu'}
        </Text>
        <Text style={[styles.rowLast, item.unreadCount > 0 && styles.rowLastUnread]} numberOfLines={1}>
          {item.lastMessage ?? 'Démarrer une conversation'}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {item.lastMessageAt && <Text style={styles.rowTime}>{formatTimestamp(item.lastMessageAt)}</Text>}
        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}


// ─── Search result row ────────────────────────────────────────────────────────

function SearchRow({ user, onPress, loading }: { user: ChatUser; onPress: (u: ChatUser) => void; loading: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.rowHover }]}
      onPress={() => onPress(user)}
      disabled={loading}
    >
      <Avatar user={user} />
      <View style={styles.rowCenter}>
        <Text style={styles.rowName}>@{user.username}</Text>
        <Text style={styles.rowLast}>Démarrer une conversation</Text>
      </View>
      {loading
        ? <ActivityIndicator size="small" color={C.accent} />
        : <Ionicons name="chevron-forward" size={16} color={C.muted} />
      }
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const navigation   = useNavigation<any>();
  const { user }     = useAppContext();
  const currentUserId = user?.id ?? '';

  const { conversations, loading: loadingConvs, reload } = useConversations(currentUserId);

  const [activeTab, setActiveTab]         = useState<Tab>('prive');
  const [query, setQuery]                 = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [searching, setSearching]         = useState(false);
  const [openingId, setOpeningId]         = useState<string | null>(null);

  const searchRef = useRef<TextInput>(null);

  // ── Search users ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query.trim()}%`)
        .neq('id', currentUserId)
        .limit(12);
      setSearchResults((data as ChatUser[]) ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, currentUserId]);

  // ── Open / create conversation ────────────────────────────────────────────
  const openChat = useCallback(async (otherUser: ChatUser) => {
    if (openingId) return;
    setOpeningId(otherUser.id);
    try {
      const convId = await findOrCreateConversation(currentUserId, otherUser.id);
      setQuery('');
      setSearchResults([]);
      setSearchFocused(false);
      navigation.navigate('Chat', { conversationId: convId, otherUser });
      reload();
    } catch (e: any) {
      console.error('openChat error', e);
      const msg = e?.message ?? 'Impossible de démarrer la conversation.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Erreur', msg);
    } finally {
      setOpeningId(null);
    }
  }, [currentUserId, navigation, openingId, reload]);

  const openExisting = useCallback((item: ConversationPreview) => {
    navigation.navigate('Chat', { conversationId: item.id, otherUser: item.otherUser });
  }, [navigation]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchResults([]);
    setSearchFocused(false);
  }, []);

  const showSearch = searchFocused || query.length > 0;

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderConv = useCallback(
    ({ item }: ListRenderItemInfo<ConversationPreview>) => <ConvRow item={item} onPress={openExisting} />,
    [openExisting]
  );

  const renderSearch = useCallback(
    ({ item }: ListRenderItemInfo<ChatUser>) => (
      <SearchRow user={item} onPress={openChat} loading={openingId === item.id} />
    ),
    [openChat, openingId]
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Messagerie</Text>
        <Pressable
          style={({ pressed }) => [styles.composeBtn, pressed && { opacity: 0.5 }]}
          hitSlop={12}
          onPress={() => { setActiveTab('prive'); setTimeout(() => searchRef.current?.focus(), 50); }}
        >
          <Ionicons name="create-outline" size={22} color={C.dark} />
        </Pressable>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={16} color={C.muted} style={{ marginRight: 6 }} />
          <TextInput
            ref={searchRef}
            style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            placeholder="Chercher un pilote..."
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => { if (!query) setSearchFocused(false); }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </Pressable>
          )}
        </View>
        {showSearch && (
          <Pressable style={styles.cancelBtn} onPress={clearSearch}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        )}
      </View>

      {/* ── Segment control (always visible) ── */}
      {!showSearch && (
        <View style={styles.tabs}>
          {(['groupes', 'prive'] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab === 'groupes' ? 'Groupes' : 'Privé'}
                </Text>
                {active && <View style={styles.tabIndicator} />}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── Content ── */}
      {showSearch ? (
        // Search results
        searching ? (
          <View style={styles.center}><ActivityIndicator color={C.accent} /></View>
        ) : searchResults.length === 0 && query.trim() ? (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={40} color={C.border} />
            <Text style={styles.emptyText}>Aucun pilote trouvé pour "{query}"</Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderSearch}
            keyExtractor={(u) => u.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )
      ) : activeTab === 'groupes' ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={52} color={C.border} />
          <Text style={styles.emptyTitle}>Groupes</Text>
          <Text style={styles.emptyText}>Les groupes arrivent bientôt.{'\n'}Reste connecté 🏎️</Text>
        </View>
      ) : loadingConvs ? (
        <View style={styles.center}><ActivityIndicator color={C.accent} /></View>
      ) : conversations.length === 0 ? (
        // Privé — empty state
        <View style={styles.center}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color={C.border} />
          <Text style={styles.emptyTitle}>Aucun message privé</Text>
          <Text style={styles.emptyText}>Cherche un pilote pour démarrer une conversation</Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => setTimeout(() => searchRef.current?.focus(), 50)}
          >
            <Text style={styles.emptyBtnText}>Trouver un pilote</Text>
          </Pressable>
        </View>
      ) : (
        // Privé — real conversations
        <FlatList
          data={conversations}
          renderItem={renderConv}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  list:   { paddingBottom: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 12,
  },
  title:      { fontSize: 17, fontWeight: '700', color: C.dark },
  composeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center' },

  // Search
  searchWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingBottom: 10, gap: 10 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg, borderRadius: 12, paddingHorizontal: 12, height: 40,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  searchBarFocused: { borderColor: C.accent },
  searchInput: { flex: 1, fontSize: 14, color: C.dark },
  cancelBtn:  { paddingVertical: 4 },
  cancelText: { color: C.accent, fontSize: 14, fontWeight: '600' },

  // Tabs
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, marginHorizontal: PAD },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  tabLabel: { fontSize: 14, fontWeight: '500', color: C.muted },
  tabLabelActive: { color: C.dark, fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: -1, left: '15%', right: '15%', height: 2.5, borderRadius: 2, backgroundColor: C.accent },

  // Row
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingVertical: 12, gap: 12 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: PAD + AVATAR_SIZE + 12 },

  avatar:        { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: C.border },
  avatarFallback:{ backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  avatarText:    { color: '#FFF', fontSize: 16, fontWeight: '700' },

  rowCenter:      { flex: 1, gap: 3 },
  rowName:        { fontSize: 15, fontWeight: '500', color: C.dark },
  rowLast:        { fontSize: 13, color: C.muted },
  rowLastUnread:  { color: C.dark, fontWeight: '500' },
  bold:           { fontWeight: '700' },
  rowRight:       { alignItems: 'flex-end', gap: 6, minWidth: 44 },
  rowTime:        { fontSize: 12, color: C.muted },

  badge:     { minWidth: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE / 2, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  emptyTitle:   { fontSize: 16, fontWeight: '700', color: C.dark },
  emptyText:    { fontSize: 13, color: C.muted, textAlign: 'center' },
  emptyBtn:     { marginTop: 8, backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
