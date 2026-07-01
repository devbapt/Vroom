import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ListRenderItemInfo, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useGroupMessages, type GroupMessage, type ChatUser } from '../hooks/useMessages';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:        '#140102',
  chatBg:    '#0D0001',
  accent:    '#E50914',
  muted:     'rgba(255,255,255,0.45)',
  border:    'rgba(255,255,255,0.12)',
  bubbleMe:  '#E50914',
  bubbleThem:'#1F0808',
  inputBg:   '#1F0808',
  white:     '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.75)',
};

type GroupDetailRouteParams = {
  GroupDetail: { groupId: string; groupName: string };
};

type GroupInfo = {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function SenderAvatar({ profile, size = 28 }: { profile: ChatUser | undefined; size?: number }) {
  const initials = (profile?.username ?? '?').slice(0, 2).toUpperCase();
  if (profile?.avatar_url) {
    return (
      <ExpoImage
        source={profile.avatar_url}
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

export default function GroupDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<GroupDetailRouteParams, 'GroupDetail'>>();
  const { groupId, groupName } = route.params;
  const { user } = useAppContext();
  const currentUserId = user?.id ?? '';

  const { messages, senderProfiles, loading, sendMessage } = useGroupMessages(groupId, currentUserId);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    supabase
      .from('groups')
      .select('id, name, description, avatar_url, member_count')
      .eq('id', groupId)
      .maybeSingle()
      .then(({ data }) => { if (data) setGroup(data as GroupInfo); });
  }, [groupId]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const ok = await sendMessage(text);
    setSending(false);
    if (ok) {
      setDraft('');
    } else {
      Alert.alert('Message non envoyé', 'Vérifie ta connexion et réessaie.');
    }
  }, [draft, sending, sendMessage]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<GroupMessage>) => {
      const isMe = item.sender_id === currentUserId;
      const nextMsg = messages[index + 1];
      const showAvatar = !isMe && (nextMsg?.sender_id !== item.sender_id || !nextMsg);
      const profile = senderProfiles[item.sender_id];

      return (
        <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
          {!isMe && (
            <View style={styles.bubbleAvatarCol}>
              {showAvatar ? <SenderAvatar profile={profile} /> : <View style={{ width: 28 }} />}
            </View>
          )}
          <View style={[styles.bubbleContent, isMe ? styles.bubbleContentMe : styles.bubbleContentThem]}>
            {!isMe && showAvatar && (
              <Text style={styles.bubbleSenderName}>@{profile?.username ?? '…'}</Text>
            )}
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.content}
              </Text>
            </View>
            <Text style={[styles.metaTime, isMe ? styles.metaMe : styles.metaThem]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      );
    },
    [currentUserId, messages, senderProfiles]
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={C.accent} />
        </Pressable>
        <View style={styles.headerCenter}>
          <SenderAvatar
            profile={group ? { id: group.id, username: group.name, avatar_url: group.avatar_url } : undefined}
            size={38}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>{group?.name ?? groupName}</Text>
            {group && <Text style={styles.headerSub}>{group.member_count} membre{group.member_count > 1 ? 's' : ''}</Text>}
          </View>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={[styles.loader, { backgroundColor: C.chatBg }]}><ActivityIndicator color={C.accent} /></View>
        ) : (
          <FlatList
            style={{ backgroundColor: C.chatBg }}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(m) => m.id}
            inverted
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatHint}>Sois le premier à écrire dans {group?.name ?? groupName} 👋</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputBar}>
          <Pressable style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Message au groupe..."
              placeholderTextColor={C.muted}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={1000}
            />
          </Pressable>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 10,
    backgroundColor: C.bg, borderBottomWidth: 0.5, borderBottomColor: C.border, gap: 4,
  },
  backBtn: { padding: 6 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  headerName: { fontSize: 15, fontWeight: '700', color: C.white },
  headerSub:  { fontSize: 11, color: C.muted },

  avatarFallback: { backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
  avatarText:     { color: '#FFF', fontSize: 12, fontWeight: '700' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list:   { paddingHorizontal: 12, paddingVertical: 12, gap: 3, flexGrow: 1 },

  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyChatHint: { fontSize: 13, color: C.muted, textAlign: 'center' },

  bubbleRow:     { marginVertical: 1, flexDirection: 'row', alignItems: 'flex-end' },
  bubbleRowMe:   { justifyContent: 'flex-end',  paddingLeft: 60 },
  bubbleRowThem: { justifyContent: 'flex-start', paddingRight: 60 },
  bubbleAvatarCol: { marginRight: 7, marginBottom: 20 },
  bubbleContent:     { maxWidth: '100%' },
  bubbleContentMe:   { alignItems: 'flex-end' },
  bubbleContentThem: { alignItems: 'flex-start' },
  bubbleSenderName:  { fontSize: 11, fontWeight: '600', color: C.muted, marginBottom: 3, marginLeft: 6 },
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: C.bubbleMe, borderBottomRightRadius: 5 },
  bubbleThem: { backgroundColor: C.bubbleThem, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: C.border },
  bubbleText:     { fontSize: 15, lineHeight: 21 },
  bubbleTextMe:   { color: '#FFF' },
  bubbleTextThem: { color: C.whiteSoft },
  metaTime: { fontSize: 10, color: C.muted, marginTop: 4, paddingHorizontal: 4 },
  metaMe:   { alignSelf: 'flex-end' },
  metaThem: { alignSelf: 'flex-start' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 10, paddingBottom: 16, gap: 8,
    backgroundColor: C.bg, borderTopWidth: 0.5, borderTopColor: C.border,
  },
  inputWrap: {
    flex: 1, backgroundColor: C.inputBg, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 9 : 5,
    minHeight: 42, justifyContent: 'center', borderWidth: 1, borderColor: C.border,
  },
  input: { fontSize: 15, color: C.white, maxHeight: 120 },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.inputBg },
});
