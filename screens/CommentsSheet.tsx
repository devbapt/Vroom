import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  Platform,
  Dimensions,
  Animated,
  Alert,
  ActivityIndicator,
  ListRenderItemInfo,
  Keyboard,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';

const C = {
  bg: '#1A0203',
  surface: 'rgba(255,255,255,0.06)',
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.6)',
  whiteFaint: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.08)',
  inputBg: 'rgba(255,255,255,0.07)',
};


type Comment = {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  parent_id: string | null;
  created_at: string;
  isLiked: boolean;
  isSaved: boolean;
  profiles?: { id: string; username: string; avatar_url: string };
};

interface Props {
  postId: string;
  visible: boolean;
  onClose: () => void;
  onCommentCountChange?: (delta: number) => void;
}

function formatAge(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'maintenant';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

interface CommentRowProps {
  comment: Comment;
  isReply?: boolean;
  currentUserId?: string;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (c: Comment) => void;
}

function CommentRow({ comment, isReply, currentUserId, onLike, onSave, onDelete, onReply }: CommentRowProps) {
  return (
    <View style={[styles.commentRow, isReply && styles.replyRow]}>
      <ExpoImage
        source={comment.profiles?.avatar_url || undefined}
        style={styles.commentAvatar}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentUsername}>@{comment.profiles?.username ?? '—'}</Text>
          <Text style={styles.commentTime}>{formatAge(comment.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
        <View style={styles.commentActions}>
          <Pressable onPress={() => onReply(comment)} hitSlop={8}>
            <Text style={styles.replyBtn}>Répondre</Text>
          </Pressable>
          {comment.user_id === currentUserId && (
            <Pressable onPress={() => onDelete(comment.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={13} color={C.whiteFaint} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.commentRight}>
        <Pressable style={styles.likeComment} onPress={() => onLike(comment.id)}>
          <Ionicons
            name={comment.isLiked ? 'heart' : 'heart-outline'}
            size={14}
            color={comment.isLiked ? C.accent : C.whiteSoft}
          />
          <Text style={[styles.likeCommentCount, comment.likes_count === 0 && styles.likeCommentCountZero]}>
            {comment.likes_count}
          </Text>
        </Pressable>
        <Pressable onPress={() => onSave(comment.id)} hitSlop={8} style={styles.saveComment}>
          <Ionicons
            name={comment.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={13}
            color={comment.isSaved ? C.accent : C.whiteSoft}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function CommentsSheet({ postId, visible, onClose, onCommentCountChange }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAppContext();

  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const slideAnim = useRef(new Animated.Value(700)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (visible && postId) {
      fetchComments();
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else if (!visible) {
      Animated.timing(slideAnim, {
        toValue: 700,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        setComments([]);
        setText('');
        setReplyTo(null);
      });
    }
    // postId dans les deps : si visible est déjà true et postId change (réouverture
    // rapide), le fetch se relance avec le bon ID sans attendre une transition visible
  }, [visible, postId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);

    try {
      const [commentsRes, likedRes, savedRes] = await Promise.all([
        // Fetch without FK-based profile join to avoid dependency on FK relationship
        supabase
          .from('post_comments')
          .select('id, user_id, content, likes_count, parent_id, created_at')
          .eq('post_id', postId)
          .order('created_at', { ascending: true }),
        user?.id
          ? supabase.from('comment_likes').select('comment_id').eq('user_id', user.id)
          : Promise.resolve({ data: [] as any[], error: null }),
        user?.id
          ? supabase.from('comment_saves').select('comment_id').eq('user_id', user.id)
          : Promise.resolve({ data: [] as any[], error: null }),
      ]);

      if (commentsRes.error) {
        console.error('[CommentsSheet] fetchComments error:', commentsRes.error.message);
        setLoading(false);
        return;
      }

      const commentRows = commentsRes.data ?? [];

      // Fetch profiles for all unique user_ids in a single query (no FK required)
      const userIds = [...new Set(commentRows.map((c: any) => c.user_id as string))];
      let profileMap: Record<string, { id: string; username: string; avatar_url: string }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);
        (profilesData ?? []).forEach((p: any) => { profileMap[p.id] = p; });
      }

      const likedIds = new Set((likedRes.data ?? []).map((r: any) => r.comment_id));
      const savedIds = new Set((savedRes.data ?? []).map((r: any) => r.comment_id));

      setComments(commentRows.map((c: any) => ({
        ...c,
        likes_count: c.likes_count ?? 0,
        profiles: profileMap[c.user_id] ?? { id: c.user_id, username: 'Utilisateur', avatar_url: '' },
        isLiked: likedIds.has(c.id),
        isSaved: savedIds.has(c.id),
      })));
    } catch (e) {
      console.error('[CommentsSheet] unexpected error:', e);
    }

    setLoading(false);
  };

  const handleSend = useCallback(async () => {
    if (!text.trim() || !user?.id || sending) return;
    setSending(true);

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: text.trim(),
        parent_id: replyTo?.id ?? null,
      })
      .select('id, user_id, content, likes_count, parent_id, created_at')
      .single();

    if (!error && data) {
      // Fetch the commenter's profile separately
      let profile = { id: user.id, username: 'Utilisateur', avatar_url: user.avatar ?? '' };
      const { data: profileData } = await supabase
        .from('profiles').select('id, username, avatar_url').eq('id', user.id).single();
      if (profileData) profile = profileData;

      const newComment: Comment = {
        ...data,
        likes_count: data.likes_count ?? 0,
        profiles: profile,
        isLiked: false,
        isSaved: false,
      };
      setComments(prev => [...prev, newComment]);
      onCommentCountChange?.(1);
      // comments_count mis à jour automatiquement par le trigger DB

      const { data: postData } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (postData?.user_id && postData.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: postData.user_id,
          actor_id: user.id,
          type: 'comment',
          post_id: postId,
          comment_id: data.id,
        });
      }
    }
    setText('');
    setReplyTo(null);
    setSending(false);
  }, [text, user?.id, sending, postId, replyTo, onCommentCountChange]);

  const handleLike = useCallback(async (commentId: string) => {
    if (!user?.id) return;
    let currentlyLiked = false;
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      currentlyLiked = c.isLiked;
      return { ...c, isLiked: !c.isLiked, likes_count: c.isLiked ? c.likes_count - 1 : c.likes_count + 1 };
    }));

    if (currentlyLiked) {
      await supabase.from('comment_likes').delete()
        .eq('comment_id', commentId).eq('user_id', user.id);
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
    }
  }, [user?.id]);

  const handleSave = useCallback(async (commentId: string) => {
    if (!user?.id) return;
    let currentlySaved = false;
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      currentlySaved = c.isSaved;
      return { ...c, isSaved: !c.isSaved };
    }));
    if (currentlySaved) {
      await supabase.from('comment_saves').delete().eq('comment_id', commentId).eq('user_id', user.id);
    } else {
      await supabase.from('comment_saves').insert({ comment_id: commentId, user_id: user.id });
    }
  }, [user?.id]);

  const handleDelete = useCallback((commentId: string) => {
    Alert.alert('Supprimer ce commentaire ?', '', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
          if (error) {
            console.error('[CommentsSheet] delete error:', error.message);
            return;
          }
          setComments(prev => prev.filter(c => c.id !== commentId));
          onCommentCountChange?.(-1);
          // comments_count mis à jour automatiquement par le trigger DB
        },
      },
    ]);
  }, [onCommentCountChange, postId]);

  // Build flat list: top-level comments interleaved with their replies
  const flatList: Array<Comment & { isReply: boolean }> = [];
  const topLevel = comments.filter(c => !c.parent_id);
  topLevel.forEach(c => {
    flatList.push({ ...c, isReply: false });
    comments.filter(r => r.parent_id === c.id).forEach(r =>
      flatList.push({ ...r, isReply: true })
    );
  });

  const renderItem = ({ item }: ListRenderItemInfo<Comment & { isReply: boolean }>) => (
    <CommentRow
      comment={item}
      isReply={item.isReply}
      currentUserId={user?.id}
      onLike={handleLike}
      onSave={handleSave}
      onDelete={handleDelete}
      onReply={setReplyTo}
    />
  );

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Le sheet monte avec le clavier via keyboardHeight — fonctionne même dans un Modal imbriqué */}
      <View style={[styles.sheetWrapper, { bottom: keyboardHeight }]}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Commentaires</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={C.whiteSoft} />
            </Pressable>
          </View>

          {/* Comments list */}
          {loading ? (
            <ActivityIndicator color={C.accent} style={{ marginTop: 32 }} />
          ) : (
            <Pressable style={styles.list} onPress={Keyboard.dismiss}>
              <FlatList
                data={flatList}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Sois le premier à commenter !</Text>
                }
              />
            </Pressable>
          )}

          {/* Reply indicator */}
          {replyTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>
                Réponse à @{replyTo.profiles?.username ?? '—'}
              </Text>
              <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                <Ionicons name="close" size={14} color={C.whiteSoft} />
              </Pressable>
            </View>
          )}

          {/* Input — paddingBottom gère la home indicator */}
          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <ExpoImage
              source={user?.avatar || undefined}
              style={styles.inputAvatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Ajouter un commentaire…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              selectionColor={C.accent}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color={C.white} />
                : <Ionicons name="send" size={18} color={C.white} />
              }
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  // Sheet ancrée en bas, monte dynamiquement via keyboardHeight
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.82,
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.whiteFaint,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },

  // List
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 0,
  },
  emptyText: {
    fontSize: 12,
    color: C.whiteFaint,
    textAlign: 'center',
    marginTop: 32,
    letterSpacing: 0.5,
  },

  // Comment
  commentRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    gap: 10,
  },
  replyRow: {
    paddingLeft: 40,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surface,
    flexShrink: 0,
  },
  commentBody: {
    flex: 1,
    gap: 3,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentUsername: {
    fontSize: 12,
    fontWeight: '700',
    color: C.white,
  },
  commentTime: {
    fontSize: 10,
    color: C.whiteFaint,
  },
  commentText: {
    fontSize: 13,
    color: C.whiteSoft,
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  replyBtn: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: C.whiteFaint,
    fontWeight: '600',
  },
  commentRight: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  likeComment: {
    alignItems: 'center',
    gap: 2,
  },
  likeCommentCount: {
    fontSize: 9,
    color: C.whiteFaint,
    minWidth: 12,
    textAlign: 'center',
  },
  likeCommentCountZero: {
    opacity: 0.35,
  },
  saveComment: {
    paddingTop: 2,
  },

  // Reply indicator
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  replyIndicatorText: {
    fontSize: 10,
    color: C.whiteSoft,
    letterSpacing: 0.5,
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  inputAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.surface,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: C.white,
    fontSize: 14,
    maxHeight: 80,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.35 },
});
