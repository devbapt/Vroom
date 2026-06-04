import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  ActivityIndicator, ListRenderItemInfo, Platform, Alert,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';
import {
  useConversations, findOrCreateConversation,
  type ConversationPreview, type ChatUser,
} from '../hooks/useMessages';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:       '#140102',
  bgCard:   '#1F0808',
  dark:     '#140102',
  accent:   '#E50914',
  muted:    'rgba(255,255,255,0.45)',
  border:   'rgba(255,255,255,0.12)',
  inputBg:  '#1F0808',
  rowHover: '#2A0A0A',
  groupTag: 'rgba(229,9,20,0.10)',
  white:    '#FFFFFF',
  whiteSoft:'rgba(255,255,255,0.7)',
};

const PAD = 16;
const AVATAR = 52;

type SearchMode = 'users' | 'groups';

// ─── Types ────────────────────────────────────────────────────────────────────

type Group = {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_private: boolean;
  member_count: number;
  my_role?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diff === 1) return 'Hier';
  if (diff < 7)   return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user }: { user: ChatUser }) {
  const initials = (user.username ?? '?').slice(0, 2).toUpperCase();
  return user.avatar_url ? (
    <ExpoImage source={user.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
  ) : (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function GroupAvatar({ group }: { group: Group }) {
  const initials = group.name.slice(0, 2).toUpperCase();
  return group.avatar_url ? (
    <ExpoImage source={group.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
  ) : (
    <View style={[styles.avatar, styles.groupAvatarFallback]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// ─── Conv Row ─────────────────────────────────────────────────────────────────

function ConvRow({ item, onPress }: { item: ConversationPreview; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.rowHover }]} onPress={onPress}>
      <Avatar user={item.otherUser} />
      <View style={styles.rowCenter}>
        <Text style={[styles.rowName, item.unreadCount > 0 && styles.bold]} numberOfLines={1}>
          {item.otherUser.username ? `@${item.otherUser.username}` : 'Utilisateur'}
        </Text>
        <Text style={[styles.rowSub, item.unreadCount > 0 && styles.rowSubUnread]} numberOfLines={1}>
          {item.lastMessage ?? 'Démarrer une conversation'}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {item.lastMessageAt && <Text style={styles.rowTime}>{formatTimestamp(item.lastMessageAt)}</Text>}
        {item.unreadCount > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text></View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Group Row ────────────────────────────────────────────────────────────────

function GroupRow({ group, onPress }: { group: Group; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.rowHover }]} onPress={onPress}>
      <GroupAvatar group={group} />
      <View style={styles.rowCenter}>
        <View style={styles.groupNameRow}>
          <Text style={styles.rowName} numberOfLines={1}>{group.name}</Text>
          {group.is_private && (
            <View style={styles.privateBadge}>
              <Ionicons name="lock-closed" size={9} color={C.accent} />
            </View>
          )}
          {group.my_role === 'admin' && (
            <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>
          )}
        </View>
        <Text style={styles.rowSub} numberOfLines={1}>
          {group.description ?? `${group.member_count} membre${group.member_count > 1 ? 's' : ''}`}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.memberCount}>
          <Ionicons name="people-outline" size={11} color={C.muted} /> {group.member_count}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Search result rows ───────────────────────────────────────────────────────

function UserResultRow({ user, loading, onPress }: { user: ChatUser; loading: boolean; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.rowHover }]} onPress={onPress} disabled={loading}>
      <Avatar user={user} />
      <View style={styles.rowCenter}>
        <Text style={styles.rowName}>@{user.username}</Text>
        <Text style={styles.rowSub}>Message privé</Text>
      </View>
      {loading ? <ActivityIndicator size="small" color={C.accent} /> : <Ionicons name="chevron-forward" size={15} color={C.muted} />}
    </Pressable>
  );
}

function GroupResultRow({ group, onPress }: { group: Group; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.rowHover }]} onPress={onPress}>
      <GroupAvatar group={group} />
      <View style={styles.rowCenter}>
        <View style={styles.groupNameRow}>
          <Text style={styles.rowName} numberOfLines={1}>{group.name}</Text>
          {group.is_private && <View style={styles.privateBadge}><Ionicons name="lock-closed" size={9} color={C.accent} /></View>}
        </View>
        <Text style={styles.rowSub} numberOfLines={1}>{group.member_count} membre{group.member_count > 1 ? 's' : ''}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={C.muted} />
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAppContext();
  const currentUserId = user?.id ?? '';

  const { conversations, loading: loadingConvs, reload } = useConversations(currentUserId);

  const [activeTab, setActiveTab]         = useState<'groupes' | 'prive'>('prive');
  const [query, setQuery]                 = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchMode, setSearchMode]       = useState<SearchMode>('users');
  const [userResults, setUserResults]     = useState<ChatUser[]>([]);
  const [groupResults, setGroupResults]   = useState<Group[]>([]);
  const [searching, setSearching]         = useState(false);
  const [openingId, setOpeningId]         = useState<string | null>(null);
  const [myGroups, setMyGroups]           = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load my groups
  const loadMyGroups = useCallback(async () => {
    if (!currentUserId) return;
    setLoadingGroups(true);
    const { data } = await supabase
      .from('group_members')
      .select('role, groups(id, name, description, avatar_url, is_private, member_count)')
      .eq('user_id', currentUserId);
    setMyGroups((data ?? []).map((r: any) => ({ ...r.groups, my_role: r.role })));
    setLoadingGroups(false);
  }, [currentUserId]);

  useFocusEffect(useCallback(() => { loadMyGroups(); }, [loadMyGroups]));

  // Search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setUserResults([]); setGroupResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const [usersRes, groupsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url')
          .ilike('username', `%${query.trim()}%`).neq('id', currentUserId).limit(8),
        supabase.from('groups').select('id, name, description, avatar_url, is_private, member_count')
          .ilike('name', `%${query.trim()}%`).limit(8),
      ]);
      setUserResults((usersRes.data as ChatUser[]) ?? []);
      setGroupResults((groupsRes.data as Group[]) ?? []);
      setSearching(false);
    }, 300);
  }, [query, currentUserId]);

  // Open DM
  const openChat = useCallback(async (otherUser: ChatUser) => {
    if (openingId) return;
    setOpeningId(otherUser.id);
    try {
      const convId = await findOrCreateConversation(currentUserId, otherUser.id);
      setQuery(''); setUserResults([]); setGroupResults([]); setSearchFocused(false);
      navigation.navigate('Chat', { conversationId: convId, otherUser });
      reload();
    } catch (e: any) {
      Platform.OS === 'web' ? alert(e?.message) : Alert.alert('Erreur', e?.message);
    } finally { setOpeningId(null); }
  }, [currentUserId, navigation, openingId, reload]);

  const openGroup = useCallback((group: Group) => {
    navigation.navigate('GroupDetail', { groupId: group.id, groupName: group.name });
  }, [navigation]);

  const clearSearch = useCallback(() => {
    setQuery(''); setUserResults([]); setGroupResults([]); setSearchFocused(false);
  }, []);

  const showSearch = searchFocused || query.length > 0;
  const hasResults = userResults.length > 0 || groupResults.length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Messagerie</Text>
        <TouchableOpacity
          style={styles.composeBtn}
          onPress={() => navigation.navigate('CreateGroup')}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={18} color={C.accent} />
          <Ionicons name="add" size={12} color={C.accent} style={{ marginLeft: -3, marginTop: -8 }} />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={15} color={searchFocused ? C.accent : C.muted} style={{ marginRight: 6 }} />
          <TextInput
            ref={searchRef}
            style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            placeholder="Chercher un pilote ou un groupe…"
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
              <Ionicons name="close-circle" size={15} color={C.muted} />
            </Pressable>
          )}
        </View>
        {showSearch && (
          <TouchableOpacity style={styles.cancelBtn} onPress={clearSearch}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tabs (hidden during search) ── */}
      {!showSearch && (
        <View style={styles.tabs}>
          {(['prive', 'groupes'] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab === 'prive' ? 'Privé' : 'Groupes'}
                </Text>
                {active && <View style={styles.tabIndicator} />}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── Content ── */}
      {showSearch ? (
        /* SEARCH RESULTS */
        searching ? (
          <View style={styles.center}><ActivityIndicator color={C.accent} /></View>
        ) : !hasResults && query.trim() ? (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={42} color={C.border} />
            <Text style={styles.emptyText}>Aucun résultat pour "{query}"</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {userResults.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Pilotes</Text>
                {userResults.map(u => (
                  <UserResultRow
                    key={u.id} user={u}
                    loading={openingId === u.id}
                    onPress={() => openChat(u)}
                  />
                ))}
              </>
            )}
            {groupResults.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Groupes</Text>
                {groupResults.map(g => (
                  <GroupResultRow key={g.id} group={g} onPress={() => openGroup(g)} />
                ))}
              </>
            )}
          </ScrollView>
        )
      ) : activeTab === 'prive' ? (
        /* DMs */
        loadingConvs ? (
          <View style={styles.center}><ActivityIndicator color={C.accent} /></View>
        ) : conversations.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={C.border} />
            <Text style={styles.emptyTitle}>Aucun message</Text>
            <Text style={styles.emptyText}>Cherche un pilote pour démarrer</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setTimeout(() => searchRef.current?.focus(), 50)}>
              <Text style={styles.emptyBtnText}>Trouver un pilote</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={({ item }: ListRenderItemInfo<ConversationPreview>) => (
              <ConvRow item={item} onPress={() => navigation.navigate('Chat', { conversationId: item.id, otherUser: item.otherUser })} />
            )}
            keyExtractor={c => c.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )
      ) : (
        /* GROUPS */
        loadingGroups ? (
          <View style={styles.center}><ActivityIndicator color={C.accent} /></View>
        ) : myGroups.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={48} color={C.border} />
            <Text style={styles.emptyTitle}>Aucun groupe</Text>
            <Text style={styles.emptyText}>Crée un groupe ou rejoins-en un via la recherche</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreateGroup')}>
              <Text style={styles.emptyBtnText}>Créer un groupe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={myGroups}
            renderItem={({ item }) => <GroupRow group={item} onPress={() => openGroup(item)} />}
            keyExtractor={g => g.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 10,
  },
  title:      { fontSize: 20, fontWeight: '700', color: C.white, letterSpacing: -0.3 },
  composeBtn: {
    flexDirection: 'row', alignItems: 'flex-start',
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(217,29,47,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Search
  searchWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingBottom: 10, gap: 8 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg, borderRadius: 12, paddingHorizontal: 12, height: 38,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  searchBarFocused: { borderColor: C.accent, backgroundColor: '#2A0A0A' },
  searchInput: { flex: 1, fontSize: 14, color: C.white },
  cancelBtn:   { paddingVertical: 4 },
  cancelText:  { color: C.accent, fontSize: 14, fontWeight: '600' },

  // Tabs
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, marginHorizontal: PAD },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  tabLabel:       { fontSize: 14, fontWeight: '500', color: C.muted },
  tabLabelActive: { color: C.white, fontWeight: '700' },
  tabIndicator:   { position: 'absolute', bottom: -1, left: '15%', right: '15%', height: 2.5, borderRadius: 2, backgroundColor: C.accent },

  // Rows
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingVertical: 11, gap: 12 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: PAD + AVATAR + 12 },

  avatar:            { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: C.border },
  avatarFallback:    { backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  groupAvatarFallback: { backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
  avatarText:        { color: '#FFF', fontSize: 17, fontWeight: '700' },

  rowCenter:    { flex: 1, gap: 3 },
  rowName:      { fontSize: 15, fontWeight: '500', color: C.white },
  bold:         { fontWeight: '700' },
  rowSub:       { fontSize: 13, color: C.muted },
  rowSubUnread: { color: C.white, fontWeight: '500' },
  rowRight:     { alignItems: 'flex-end', gap: 5, minWidth: 44 },
  rowTime:      { fontSize: 11, color: C.muted },
  memberCount:  { fontSize: 11, color: C.muted },

  groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  privateBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(217,29,47,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  adminBadge: {
    backgroundColor: C.accent, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  adminBadgeText: { fontSize: 9, color: '#FFF', fontWeight: '700' },

  badge:     { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 4, letterSpacing: 0.5 },

  emptyTitle:   { fontSize: 16, fontWeight: '700', color: C.white },
  emptyText:    { fontSize: 13, color: C.muted, textAlign: 'center' },
  emptyBtn:     { marginTop: 8, backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
