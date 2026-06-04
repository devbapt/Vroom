import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Dimensions, Share, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';
import CommentsSheet from './CommentsSheet';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostDetailParams = {
  id: string;
  name: string;
  image: string;
  description?: string;
  date?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  bg:         '#140102',
  bgCard:     '#1F0808',
  accent:     '#E50914',
  white:      '#FFFFFF',
  whiteSoft:  'rgba(255,255,255,0.7)',
  whiteFaint: 'rgba(255,255,255,0.3)',
  border:     'rgba(255,255,255,0.10)',
};

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({
  icon, label, onPress, active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.65 }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={active ? C.accent : C.whiteSoft} />
      <Text style={[styles.actionLabel, active && { color: C.accent }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PostDetailScreen() {
  const insets    = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route     = useRoute<RouteProp<{ PostDetail: PostDetailParams }, 'PostDetail'>>();
  const { id, name, image, description, date } = route.params;

  const { user } = useAppContext();

  const [isLiked,       setIsLiked]       = useState(false);
  const [isSaved,       setIsSaved]       = useState(false);
  const [likesCount,    setLikesCount]    = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [commentsOpen,  setCommentsOpen]  = useState(false);

  // ── Fetch stats on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [postRes, likedRes, savedRes] = await Promise.all([
        supabase.from('posts').select('likes_count, comments_count').eq('id', id).single(),
        user?.id
          ? supabase.from('post_likes').select('post_id')
              .eq('post_id', id).eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        user?.id
          ? supabase.from('saved_posts').select('post_id')
              .eq('post_id', id).eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setLikesCount(postRes.data?.likes_count ?? 0);
      setCommentsCount(postRes.data?.comments_count ?? 0);
      setIsLiked(!!likedRes.data);
      setIsSaved(!!savedRes.data);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [id, user?.id]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!user?.id) return;
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(p => Math.max(0, p - 1));
      await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', user.id);
    } else {
      setIsLiked(true);
      setLikesCount(p => p + 1);
      await supabase.from('post_likes').insert({ post_id: id, user_id: user.id });
    }
  }, [isLiked, user?.id, id]);

  const handleSave = useCallback(async () => {
    if (!user?.id) return;
    if (isSaved) {
      setIsSaved(false);
      await supabase.from('saved_posts').delete().eq('post_id', id).eq('user_id', user.id);
    } else {
      setIsSaved(true);
      await supabase.from('saved_posts').insert({ post_id: id, user_id: user.id });
    }
  }, [isSaved, user?.id, id]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: `Découvre ce post sur Vroom : ${name}` });
    } catch (_) {}
  }, [name]);

  return (
    <View style={styles.root}>

      {/* ── Image zone ──────────────────────────────────────────────────── */}
      <View style={styles.imageZone}>
        <ExpoImage
          source={image || undefined}
          style={styles.image}
          contentFit="contain"
          cachePolicy="memory-disk"
        />

        {/* Bouton retour positionné avec l'inset réel — toujours accessible */}
        <Pressable
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
          hitSlop={16}
        >
          <Ionicons name="chevron-back" size={22} color={C.white} />
        </Pressable>

        {/* Bouton partager en haut à droite */}
        <Pressable
          style={[styles.shareBtn, { top: insets.top + 10 }]}
          onPress={handleShare}
          hitSlop={16}
        >
          <Ionicons name="share-outline" size={20} color={C.whiteSoft} />
        </Pressable>
      </View>

      {/* ── Contenu ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Titre */}
        <Text style={styles.title} numberOfLines={2}>{name}</Text>

        {/* Stats */}
        {loading ? (
          <ActivityIndicator color={C.accent} style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{likesCount.toLocaleString('fr-FR')}</Text>
              <Text style={styles.statLbl}>Likes</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{commentsCount}</Text>
              <Text style={styles.statLbl}>Commentaires</Text>
            </View>
          </View>
        )}

        {/* Description */}
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}

        {/* Date */}
        {date ? (
          <Text style={styles.date}>{date}</Text>
        ) : null}
      </ScrollView>

      {/* ── Barre d'actions — au-dessus de la tab bar ───────────────────── */}
      <View style={[styles.actionsBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <ActionBtn
          icon={isLiked ? 'heart' : 'heart-outline'}
          label={isLiked ? 'Aimé' : 'Like'}
          onPress={handleLike}
          active={isLiked}
        />
        <ActionBtn
          icon="chatbubble-outline"
          label="Commenter"
          onPress={() => setCommentsOpen(true)}
        />
        <ActionBtn
          icon="share-outline"
          label="Partager"
          onPress={handleShare}
        />
        <ActionBtn
          icon={isSaved ? 'bookmark' : 'bookmark-outline'}
          label={isSaved ? 'Sauvegardé' : 'Sauvegarder'}
          onPress={handleSave}
          active={isSaved}
        />
      </View>

      {/* ── Comments sheet ───────────────────────────────────────────────── */}
      <CommentsSheet
        postId={id}
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCommentCountChange={(delta) => setCommentsCount(p => Math.max(0, p + delta))}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const IMAGE_HEIGHT = Math.min(SCREEN_WIDTH, 420);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Image zone
  imageZone: { position: 'relative' },
  image: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#000',
  },
  backBtn: {
    position: 'absolute',
    left: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.50)',
    justifyContent: 'center', alignItems: 'center',
  },
  shareBtn: {
    position: 'absolute',
    right: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.50)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Content
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },

  title: { fontSize: 17, fontWeight: '700', color: C.white, marginBottom: 12 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, marginBottom: 12,
    borderTopWidth: 0.5, borderBottomWidth: 0.5,
    borderTopColor: C.border, borderBottomColor: C.border,
  },
  stat:    { flex: 1, alignItems: 'center' },
  statDiv: { width: 0.5, height: 24, backgroundColor: C.border },
  statNum: { fontSize: 15, fontWeight: '700', color: C.white, marginBottom: 1 },
  statLbl: { fontSize: 10, color: C.whiteFaint, letterSpacing: 0.3 },

  description: { fontSize: 14, color: C.whiteSoft, lineHeight: 21, marginBottom: 6 },
  date:        { fontSize: 11, color: C.whiteFaint },

  // Action bar
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 0.5, borderTopColor: C.border,
    paddingTop: 10,
    backgroundColor: C.bg,
  },
  actionBtn: {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 4,
  },
  actionLabel: { fontSize: 10, fontWeight: '600', color: C.whiteSoft },
});
