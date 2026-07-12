import { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable,
  Dimensions, Share, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';
import CommentsSheet from './CommentsSheet';
import AppText from '../components/ui/AppText';

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
      <AppText weight="semibold" style={[styles.actionLabel, active && { color: C.accent }]}>{label}</AppText>
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

  const [isLiked,        setIsLiked]        = useState(false);
  const [isSaved,        setIsSaved]        = useState(false);
  const [likesCount,     setLikesCount]     = useState(0);
  const [commentsCount,  setCommentsCount]  = useState(0);
  const [postOwnerId,    setPostOwnerId]    = useState<string | null>(null);
  const [posterUsername, setPosterUsername] = useState('');
  const [loading,        setLoading]        = useState(true);
  const [commentsOpen,   setCommentsOpen]   = useState(false);
  const [imageRatio,     setImageRatio]     = useState(4 / 5);

  // ── Fetch stats on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [postRes, likedRes, savedRes] = await Promise.all([
        supabase.from('posts')
          .select('user_id, likes_count, comments_count, profiles!user_id(username)')
          .eq('id', id).single(),
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
      setPostOwnerId(postRes.data?.user_id ?? null);
      setPosterUsername((postRes.data as any)?.profiles?.username ?? '');
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
      await supabase.from('notifications').delete().match({ actor_id: user.id, post_id: id, type: 'like' });
    } else {
      setIsLiked(true);
      setLikesCount(p => p + 1);
      await supabase.from('post_likes').insert({ post_id: id, user_id: user.id });
      if (postOwnerId && postOwnerId !== user.id) {
        await supabase.from('notifications').insert({ user_id: postOwnerId, actor_id: user.id, type: 'like', post_id: id });
      }
    }
  }, [isLiked, user?.id, id, postOwnerId]);

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

      {/* ── Image zone — ratio réel de la photo, sans bande noire ─────────── */}
      <View style={styles.imageZone}>
        <ExpoImage
          source={image || undefined}
          style={[styles.image, { aspectRatio: imageRatio }]}
          contentFit="cover"
          cachePolicy="memory-disk"
          onLoad={(e) => {
            const { width: w, height: h } = e.source;
            if (w && h) setImageRatio(Math.min(Math.max(w / h, 0.66), 1.5));
          }}
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

      {/* ── Barre d'actions — juste sous l'image, compteurs exacts sur les icônes ── */}
      <View style={styles.actionsBar}>
        <ActionBtn
          icon={isLiked ? 'heart' : 'heart-outline'}
          label={likesCount.toLocaleString('fr-FR')}
          onPress={handleLike}
          active={isLiked}
        />
        <ActionBtn
          icon="chatbubble-outline"
          label={commentsCount.toLocaleString('fr-FR')}
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

      {/* ── Contenu — légende compacte ─────────────────────────────────────── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={C.accent} style={{ marginVertical: 8 }} />
        ) : (
          <>
            {/* Légende : pseudo en gras + description — les compteurs sont sur les icônes ci-dessus */}
            {(posterUsername || description) ? (
              <AppText weight="regular" style={styles.caption}>
                {posterUsername ? <AppText weight="bold" style={styles.captionUsername}>{posterUsername}  </AppText> : null}
                {description || name}
              </AppText>
            ) : null}

            {date ? <AppText weight="regular" style={styles.date}>{date}</AppText> : null}
          </>
        )}
      </ScrollView>

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Image zone — hauteur dérivée du ratio réel de la photo (imageRatio), pas de valeur fixe
  imageZone: { position: 'relative' },
  image: {
    width: SCREEN_WIDTH,
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
  contentContainer: { paddingHorizontal: 18, paddingTop: 12 },

  caption: { fontSize: 13.5, color: C.whiteSoft, lineHeight: 19, marginBottom: 6 },
  captionUsername: { fontSize: 13.5, color: C.white },
  date: { fontSize: 10.5, color: C.whiteFaint, opacity: 0.7, marginTop: 2 },

  // Action bar — directement sous l'image
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 0.5, borderBottomWidth: 0.5,
    borderTopColor: C.border, borderBottomColor: C.border,
    paddingTop: 10, paddingBottom: 6,
    backgroundColor: C.bg,
  },
  actionBtn: {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 4,
  },
  actionLabel: { fontSize: 10, color: C.whiteSoft },
});
