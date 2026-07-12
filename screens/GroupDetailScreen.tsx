import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ListRenderItemInfo, TouchableOpacity, Modal, ScrollView, Keyboard,
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
  card:      '#1F0808',
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
  is_private: boolean;
  require_vehicle: boolean;
  require_reason: boolean;
};

type MembershipState = 'loading' | 'admin' | 'member' | 'none';
type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

type PendingRequest = {
  id: string;
  user_id: string;
  reason: string | null;
  vehicle_info: string | null;
  profile?: ChatUser;
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

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [membershipState, setMembershipState] = useState<MembershipState>('loading');
  const [joinRequestStatus, setJoinRequestStatus] = useState<JoinRequestStatus | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [vehicleText, setVehicleText] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [requestsSheetVisible, setRequestsSheetVisible] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const isMember = membershipState === 'member' || membershipState === 'admin';

  const { messages, senderProfiles, loading, sendMessage } = useGroupMessages(groupId, isMember ? currentUserId : '');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!groupId || !currentUserId) return;
    let cancelled = false;

    (async () => {
      const { data: groupData } = await supabase
        .from('groups')
        .select('id, name, description, avatar_url, member_count, is_private, require_vehicle, require_reason')
        .eq('id', groupId)
        .maybeSingle();
      if (cancelled) return;
      if (groupData) setGroup(groupData as GroupInfo);

      const { data: memberRow } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', currentUserId)
        .maybeSingle();
      if (cancelled) return;

      if (memberRow) {
        setMembershipState(memberRow.role === 'admin' ? 'admin' : 'member');
        return;
      }

      if (groupData && !groupData.is_private) {
        const { error: joinError } = await supabase
          .from('group_members')
          .insert({ group_id: groupId, user_id: currentUserId, role: 'member' });
        if (!cancelled) setMembershipState(joinError ? 'none' : 'member');
        return;
      }

      const { data: reqRow } = await supabase
        .from('group_join_requests')
        .select('id, status')
        .eq('group_id', groupId)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setJoinRequestStatus(reqRow ? (reqRow.status as JoinRequestStatus) : null);
      setMembershipState('none');
    })();

    return () => { cancelled = true; };
  }, [groupId, currentUserId]);

  const handleSubmitJoinRequest = useCallback(async () => {
    if (!currentUserId || submittingRequest) return;
    setSubmittingRequest(true);
    const { data, error } = await supabase
      .from('group_join_requests')
      .insert({
        group_id: groupId,
        user_id: currentUserId,
        reason: group?.require_reason ? (reasonText.trim() || null) : null,
        vehicle_info: group?.require_vehicle ? (vehicleText.trim() || null) : null,
      })
      .select('id, status')
      .single();
    setSubmittingRequest(false);
    if (!error && data) {
      setJoinRequestStatus(data.status as JoinRequestStatus);
    } else {
      Alert.alert('Erreur', "Impossible d'envoyer la demande.");
    }
  }, [groupId, currentUserId, submittingRequest, reasonText, vehicleText, group]);

  const loadPendingRequests = useCallback(async () => {
    setLoadingRequests(true);
    const { data } = await supabase
      .from('group_join_requests')
      .select('id, user_id, reason, vehicle_info')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    const rows = data ?? [];
    const userIds = [...new Set(rows.map((r: any) => r.user_id as string))];
    let profileMap: Record<string, ChatUser> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds);
      (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
    }
    setPendingRequests(rows.map((r: any) => ({ ...r, profile: profileMap[r.user_id] })));
    setLoadingRequests(false);
  }, [groupId]);

  const openRequestsSheet = useCallback(() => {
    setRequestsSheetVisible(true);
    loadPendingRequests();
  }, [loadPendingRequests]);

  const handleAcceptRequest = useCallback(async (req: PendingRequest) => {
    const { error: insertErr } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: req.user_id, role: 'member' });
    if (!insertErr) {
      await supabase.from('group_join_requests').update({ status: 'approved' }).eq('id', req.id);
      setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    } else {
      Alert.alert('Erreur', "Impossible d'accepter cette demande.");
    }
  }, [groupId]);

  const handleRejectRequest = useCallback(async (req: PendingRequest) => {
    await supabase.from('group_join_requests').update({ status: 'rejected' }).eq('id', req.id);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  }, []);

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
        {membershipState === 'admin' ? (
          <Pressable onPress={openRequestsSheet} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="people-outline" size={22} color={C.accent} />
          </Pressable>
        ) : (
          <View style={{ width: 26 }} />
        )}
      </View>

      {membershipState === 'loading' ? (
        <View style={[styles.loader, { backgroundColor: C.chatBg }]}><ActivityIndicator color={C.accent} /></View>
      ) : membershipState === 'none' ? (
        <View style={styles.joinContainer}>
          {joinRequestStatus === 'pending' ? (
            <>
              <Ionicons name="time-outline" size={40} color={C.muted} />
              <Text style={styles.joinTitle}>Demande envoyée</Text>
              <Text style={styles.joinHint}>En attente de validation par un administrateur de {group?.name ?? groupName}.</Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed-outline" size={40} color={C.muted} />
              <Text style={styles.joinTitle}>Groupe privé</Text>
              <Text style={styles.joinHint}>
                {joinRequestStatus === 'rejected'
                  ? 'Ta précédente demande a été refusée. Tu peux en envoyer une nouvelle.'
                  : `Demande à rejoindre ${group?.name ?? groupName} pour voir les discussions.`}
              </Text>

              {group?.require_reason && (
                <TextInput
                  style={styles.joinInput}
                  placeholder="Pourquoi veux-tu rejoindre ce groupe ?"
                  placeholderTextColor={C.muted}
                  value={reasonText}
                  onChangeText={setReasonText}
                  multiline
                />
              )}
              {group?.require_vehicle && (
                <TextInput
                  style={styles.joinInput}
                  placeholder="Ton véhicule (marque, modèle...)"
                  placeholderTextColor={C.muted}
                  value={vehicleText}
                  onChangeText={setVehicleText}
                />
              )}

              <TouchableOpacity
                style={[styles.joinBtn, submittingRequest && { opacity: 0.6 }]}
                onPress={handleSubmitJoinRequest}
                disabled={submittingRequest}
              >
                {submittingRequest
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={styles.joinBtnText}>Demander à rejoindre</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {loading ? (
            <View style={[styles.loader, { backgroundColor: C.chatBg }]}><ActivityIndicator color={C.accent} /></View>
          ) : (
            <Pressable style={styles.flex} onPress={Keyboard.dismiss}>
              <FlatList
                style={{ backgroundColor: C.chatBg }}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(m) => m.id}
                inverted
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                ListEmptyComponent={
                  <View style={styles.emptyChat}>
                    <Text style={styles.emptyChatHint}>Sois le premier à écrire dans {group?.name ?? groupName} 👋</Text>
                  </View>
                }
              />
            </Pressable>
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
      )}

      <Modal visible={requestsSheetVisible} animationType="slide" transparent onRequestClose={() => setRequestsSheetVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Demandes d'adhésion</Text>
              <Pressable onPress={() => setRequestsSheetVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={C.whiteSoft} />
              </Pressable>
            </View>

            {loadingRequests ? (
              <ActivityIndicator color={C.accent} style={{ marginVertical: 24 }} />
            ) : pendingRequests.length === 0 ? (
              <Text style={styles.modalEmpty}>Aucune demande en attente.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 420 }}>
                {pendingRequests.map((req) => (
                  <View key={req.id} style={styles.requestRow}>
                    <SenderAvatar profile={req.profile} size={36} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.requestUsername}>@{req.profile?.username ?? '…'}</Text>
                      {!!req.reason && <Text style={styles.requestDetail}>{req.reason}</Text>}
                      {!!req.vehicle_info && <Text style={styles.requestDetail}>{req.vehicle_info}</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectRequest(req)}>
                        <Ionicons name="close" size={16} color={C.white} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptRequest(req)}>
                        <Ionicons name="checkmark" size={16} color={C.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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

  // ── Join request state ──
  joinContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  joinTitle: { fontSize: 17, fontWeight: '700', color: C.white, textAlign: 'center' },
  joinHint: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },
  joinInput: {
    width: '100%', backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 10, color: C.white, fontSize: 14, marginTop: 4,
  },
  joinBtn: {
    marginTop: 8, backgroundColor: C.accent, borderRadius: 24,
    paddingHorizontal: 24, paddingVertical: 12, minWidth: 200, alignItems: 'center',
  },
  joinBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // ── Pending requests modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: C.white },
  modalEmpty: { color: C.muted, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
  requestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: C.border },
  requestUsername: { fontSize: 13, fontWeight: '700', color: C.white },
  requestDetail: { fontSize: 11, color: C.muted, marginTop: 2 },
  acceptBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
});
