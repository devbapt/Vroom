import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ListRenderItemInfo,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { useMessages, type Message, type ChatUser } from '../hooks/useMessages';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatRouteParams = {
  Chat: { conversationId: string; otherUser: ChatUser };
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:         '#140102',
  chatBg:     '#0D0001',
  dark:       '#140102',
  accent:     '#E50914',
  muted:      'rgba(255,255,255,0.45)',
  border:     'rgba(255,255,255,0.12)',
  bubbleMe:   '#E50914',
  bubbleThem: '#1F0808',
  inputBg:    '#1F0808',
  white:      '#FFFFFF',
  whiteSoft:  'rgba(255,255,255,0.75)',
};

// ─── Action menu items ────────────────────────────────────────────────────────

const ACTIONS = [
  { id: 'photo',    icon: 'image-outline',          label: 'Photo',    color: '#5856D6' },
  { id: 'camera',   icon: 'camera-outline',          label: 'Caméra',   color: '#FF9500' },
  { id: 'location', icon: 'location-outline',        label: 'Position', color: '#34C759' },
  { id: 'map',      icon: 'map-outline',             label: 'Carte',    color: '#007AFF' },
] as const;

type ActionId = typeof ACTIONS[number]['id'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 34 }: { user: ChatUser; size?: number }) {
  const initials = (user.username ?? '?').slice(0, 2).toUpperCase();
  if (user.avatar_url) {
    return (
      <ExpoImage
        source={user.avatar_url}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// ─── Read receipt ─────────────────────────────────────────────────────────────

function ReadReceipt({ isRead }: { isRead: boolean }) {
  return (
    <View style={styles.receiptRow}>
      {/* first check */}
      <Ionicons name="checkmark" size={11} color={isRead ? '#007AFF' : '#8E8E93'} />
      {/* second check overlapping slightly */}
      <Ionicons name="checkmark" size={11} color={isRead ? '#007AFF' : '#8E8E93'} style={{ marginLeft: -5 }} />
    </View>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

interface BubbleProps {
  msg: Message;
  isMe: boolean;
  otherUser: ChatUser;
  showAvatar: boolean;
  onDoubleTap: (id: string, liked: boolean) => void;
  onLongPress: (id: string, isMe: boolean) => void;
}

function MessageBubble({ msg, isMe, otherUser, showAvatar, onDoubleTap, onLongPress }: BubbleProps) {
  const lastTapRef = useRef<number>(0);

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) onDoubleTap(msg.id, msg.is_liked);
    lastTapRef.current = now;
  }, [msg.id, msg.is_liked, onDoubleTap]);

  return (
    <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
      {/* Avatar (received messages only) */}
      {!isMe && (
        <View style={styles.bubbleAvatarCol}>
          {showAvatar ? <UserAvatar user={otherUser} size={28} /> : <View style={{ width: 28 }} />}
        </View>
      )}

      <View style={[styles.bubbleContent, isMe ? styles.bubbleContentMe : styles.bubbleContentThem]}>
        {/* Username above first bubble in sequence */}
        {!isMe && showAvatar && (
          <Text style={styles.bubbleSenderName}>@{otherUser.username}</Text>
        )}

        <Pressable
          onPress={handlePress}
          onLongPress={() => onLongPress(msg.id, isMe)}
          delayLongPress={420}
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleThem,
            msg.is_deleted && styles.bubbleDeleted,
          ]}
        >
          <Text style={[
            styles.bubbleText,
            isMe ? styles.bubbleTextMe : styles.bubbleTextThem,
            msg.is_deleted && styles.bubbleTextDeleted,
          ]}>
            {msg.is_deleted ? 'Message supprimé' : msg.content}
          </Text>
          {msg.is_liked && !msg.is_deleted && (
            <View style={[styles.likeTag, isMe ? styles.likeTagMe : styles.likeTagThem]}>
              <Text style={{ fontSize: 11 }}>❤️</Text>
            </View>
          )}
        </Pressable>

        <View style={[styles.meta, isMe ? styles.metaMe : styles.metaThem]}>
          <Text style={styles.metaTime}>{formatTime(msg.created_at)}</Text>
          {isMe && !msg.is_deleted && <ReadReceipt isRead={msg.is_read} />}
        </View>
      </View>
    </View>
  );
}

// ─── Action menu ──────────────────────────────────────────────────────────────

function ActionMenu({ visible, onAction }: { visible: boolean; onAction: (id: ActionId) => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [visible, anim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.actionMenu,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.actionItem}
          onPress={() => onAction(action.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.actionCircle, { backgroundColor: action.color }]}>
            <Ionicons name={action.icon as any} size={22} color="#FFF" />
          </View>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
  const { conversationId, otherUser } = route.params;
  const { user } = useAppContext();

  const currentUserId = user?.id ?? '';
  const { messages, loading, sendMessage, likeMessage, deleteMessage } =
    useMessages(conversationId, currentUserId);

  const [draft, setDraft]         = useState('');
  const [sending, setSending]     = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  const inputRef  = useRef<TextInput>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = useCallback(() => {
    const next = !menuOpen;
    setMenuOpen(next);
    Animated.spring(rotateAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    if (next) inputRef.current?.blur();
  }, [menuOpen, rotateAnim]);

  const closeMenu = useCallback(() => {
    if (!menuOpen) return;
    setMenuOpen(false);
    Animated.spring(rotateAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
  }, [menuOpen, rotateAnim]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleAction = useCallback(async (id: ActionId) => {
    closeMenu();
    if (id === 'photo' || id === 'camera') {
      const launch = id === 'camera'
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
      const result = await launch({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        await sendMessage(`📷 [Photo partagée]`);
      }
    } else if (id === 'location') {
      await sendMessage('📍 Position partagée');
    } else if (id === 'map') {
      await sendMessage('🗺️ Carte partagée');
    }
  }, [closeMenu, sendMessage]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    closeMenu();
    await sendMessage(text);
    setSending(false);
  }, [draft, sending, sendMessage, closeMenu]);

  // ── Double-tap like ───────────────────────────────────────────────────────
  const handleDoubleTap = useCallback(
    (id: string, liked: boolean) => likeMessage(id, liked),
    [likeMessage]
  );

  // ── Long press delete ─────────────────────────────────────────────────────
  const handleLongPress = useCallback((id: string, isMe: boolean) => {
    if (!isMe) return;
    const doDelete = () => deleteMessage(id);
    if (Platform.OS === 'web') {
      if ((window as any).confirm('Supprimer ce message ?')) doDelete();
    } else {
      Alert.alert('Supprimer', 'Supprimer ce message ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  }, [deleteMessage]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Message>) => {
      const isMe = item.sender_id === currentUserId;
      // FlatList is inverted: index 0 = newest. index+1 = previous (older) message.
      const nextMsg = messages[index + 1];
      // Show avatar when sender changes (first message of a sequence from this sender)
      const showAvatar = !isMe && (nextMsg?.sender_id !== item.sender_id || !nextMsg);
      return (
        <MessageBubble
          msg={item}
          isMe={isMe}
          otherUser={otherUser}
          showAvatar={showAvatar}
          onDoubleTap={handleDoubleTap}
          onLongPress={handleLongPress}
        />
      );
    },
    [currentUserId, messages, otherUser, handleDoubleTap, handleLongPress]
  );

  const plusRotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={C.accent} />
        </Pressable>

        <Pressable style={styles.headerCenter} onPress={() => {}}>
          <UserAvatar user={otherUser} size={38} />
          <Text style={styles.headerName} numberOfLines={1}>@{otherUser.username}</Text>
        </Pressable>

        <Pressable hitSlop={12} style={styles.headerRight}>
          <Ionicons name="call-outline" size={20} color={C.muted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Messages ── */}
        {loading ? (
          <View style={[styles.loader, { backgroundColor: C.chatBg }]}><ActivityIndicator color={C.accent} /></View>
        ) : (
          <Pressable style={[styles.flex, { backgroundColor: C.chatBg }]} onPress={closeMenu}>
            <FlatList
              data={messages}
              renderItem={renderItem}
              keyExtractor={(m) => m.id}
              inverted
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <UserAvatar user={otherUser} size={52} />
                  <Text style={styles.emptyChatName}>@{otherUser.username}</Text>
                  <Text style={styles.emptyChatHint}>Dis bonjour 👋</Text>
                </View>
              }
            />
          </Pressable>
        )}

        {/* ── Action menu (fan) ── */}
        <ActionMenu visible={menuOpen} onAction={handleAction} />

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
          {/* + button */}
          <TouchableOpacity onPress={toggleMenu} style={styles.plusBtn} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ rotate: plusRotate }] }}>
              <Ionicons name="add" size={22} color={menuOpen ? C.accent : C.muted} />
            </Animated.View>
          </TouchableOpacity>

          {/* Text input */}
          <Pressable style={styles.inputWrap} onPress={closeMenu}>
            <TextInput
              ref={inputRef}
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Message..."
              placeholderTextColor={C.muted}
              value={draft}
              onChangeText={(t) => { setDraft(t); closeMenu(); }}
              multiline
              maxLength={1000}
              onFocus={closeMenu}
            />
          </Pressable>

          {/* Send button */}
          <TouchableOpacity
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            activeOpacity={0.7}
          >
            {sending
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Ionicons name="arrow-up" size={18} color="#FFF" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: C.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    gap: 4,
  },
  backBtn: { padding: 6 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  headerName: { fontSize: 15, fontWeight: '700', color: C.white },
  headerRight:  { padding: 6 },
  avatarFallback: { backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
  avatarText:     { color: '#FFF', fontSize: 12, fontWeight: '700' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list:   { paddingHorizontal: 12, paddingVertical: 12, gap: 3, flexGrow: 1 },

  // Empty chat state
  emptyChat: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, gap: 12,
  },
  emptyChatName: { fontSize: 17, fontWeight: '700', color: C.white },
  emptyChatHint: { fontSize: 13, color: C.muted },

  // Bubbles
  bubbleRow:        { marginVertical: 1, flexDirection: 'row', alignItems: 'flex-end' },
  bubbleRowMe:      { justifyContent: 'flex-end',   paddingLeft: 60 },
  bubbleRowThem:    { justifyContent: 'flex-start',  paddingRight: 60 },
  bubbleAvatarCol:  { marginRight: 7, marginBottom: 20 },
  bubbleContent:    { maxWidth: '100%' },
  bubbleContentMe:  { alignItems: 'flex-end' },
  bubbleContentThem:{ alignItems: 'flex-start' },
  bubbleSenderName: { fontSize: 11, fontWeight: '600', color: C.muted, marginBottom: 3, marginLeft: 6 },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative',
  },
  bubbleMe: {
    backgroundColor: C.bubbleMe,
    borderBottomRightRadius: 5,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleThem: {
    backgroundColor: C.bubbleThem,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleDeleted: { opacity: 0.45 },
  bubbleText:        { fontSize: 15, lineHeight: 21 },
  bubbleTextMe:      { color: '#FFF' },
  bubbleTextThem:    { color: C.whiteSoft },
  bubbleTextDeleted: { fontStyle: 'italic' },
  likeTag: {
    position: 'absolute', bottom: -11,
    backgroundColor: '#2A0A0A',
    borderRadius: 12, paddingHorizontal: 4, paddingVertical: 2,
    borderWidth: 0.5, borderColor: C.border,
  },
  likeTagMe:   { right: 8 },
  likeTagThem: { left: 8 },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: 4 },
  metaMe:   { justifyContent: 'flex-end' },
  metaThem: { justifyContent: 'flex-start' },
  metaTime:   { fontSize: 10, color: C.muted },
  receiptRow: { flexDirection: 'row', alignItems: 'center' },

  // Action menu
  actionMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: C.bg,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  actionItem:   { alignItems: 'center', gap: 8 },
  actionCircle: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  actionLabel:  { fontSize: 11, color: C.muted, fontWeight: '500' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 10, paddingBottom: 16, gap: 8,
    backgroundColor: C.bg,
    borderTopWidth: 0.5, borderTopColor: C.border,
  },
  plusBtn: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.inputBg,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 9 : 5,
    minHeight: 42,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  input: { fontSize: 15, color: C.white, maxHeight: 120 },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.accent,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: C.inputBg,
    shadowOpacity: 0,
    elevation: 0,
  },
});
