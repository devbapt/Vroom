import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';
import CommentsSheet from './CommentsSheet';

const { width } = Dimensions.get('window');

const C = {
  bg:         '#140102',
  surface:    'rgba(255,255,255,0.06)',
  accent:     '#E50914',
  white:      '#FFFFFF',
  whiteSoft:  'rgba(255,255,255,0.65)',
  whiteFaint: 'rgba(255,255,255,0.25)',
  border:     'rgba(255,255,255,0.10)',
};

type PostDetailModalProps = {
  visible: boolean;
  post: {
    id: string;
    name: string;
    image: string;
    description?: string;
    date?: string;
  } | null;
  onClose: () => void;
};

export default function PostDetailModal({ visible, post, onClose }: PostDetailModalProps) {
  const { user } = useAppContext();

  const [isLiked, setIsLiked]   = useState(false);
  const [isSaved, setIsSaved]   = useState(false);
  const [likesCount, setLikesCount]     = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);

  // Charger les stats réelles depuis Supabase à l'ouverture
  useEffect(() => {
    if (!visible || !post?.id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [postRes, likedRes, savedRes] = await Promise.all([
        supabase.from('posts').select('likes_count, comments_count').eq('id', post.id).single(),
        user?.id
          ? supabase.from('post_likes').select('post_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        user?.id
          ? supabase.from('saved_posts').select('post_id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
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
  }, [visible, post?.id, user?.id]);

  const handleLike = useCallback(async () => {
    if (!user?.id || !post?.id) return;

    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      await supabase.from('posts').update({ likes_count: Math.max(0, likesCount - 1) }).eq('id', post.id);
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      await supabase.from('posts').update({ likes_count: likesCount + 1 }).eq('id', post.id);
    }
  }, [isLiked, user?.id, post?.id, likesCount]);

  const handleSave = useCallback(async () => {
    if (!user?.id || !post?.id) return;

    if (isSaved) {
      setIsSaved(false);
      await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      setIsSaved(true);
      await supabase.from('saved_posts').insert({ post_id: post.id, user_id: user.id });
    }
  }, [isSaved, user?.id, post?.id]);

  const handleShare = useCallback(async () => {
    if (!post) return;
    try {
      await Share.share({ message: `Découvre ce post sur Vroom : ${post.name}` });
    } catch (_) {}
  }, [post]);

  const handleClose = useCallback(() => {
    setCommentsVisible(false);
    onClose();
  }, [onClose]);

  if (!post) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={15}>
            <Ionicons name="chevron-down" size={28} color={C.white} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{post.name}</Text>
          <Pressable onPress={handleShare} hitSlop={12}>
            <Ionicons name="share-outline" size={22} color={C.whiteSoft} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image 16:9 */}
          <ExpoImage
            source={post.image || undefined}
            style={styles.postImage}
            contentFit="contain"
            cachePolicy="memory-disk"
          />

          <View style={styles.infoSection}>

            {/* Stats row */}
            {loading ? (
              <ActivityIndicator color={C.accent} style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{likesCount.toLocaleString('fr-FR')}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{commentsCount}</Text>
                  <Text style={styles.statLabel}>Commentaires</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>—</Text>
                  <Text style={styles.statLabel}>Partages</Text>
                </View>
              </View>
            )}

            {/* Description */}
            {post.description ? (
              <Text style={styles.description}>{post.description}</Text>
            ) : null}

            {/* Date */}
            {post.date ? (
              <Text style={styles.date}>{post.date}</Text>
            ) : null}

            <View style={styles.divider} />

            {/* Action buttons */}
            <View style={styles.actionsRow}>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                onPress={handleLike}
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isLiked ? C.accent : C.whiteSoft}
                />
                <Text style={[styles.actionLabel, isLiked && { color: C.accent }]}>
                  {isLiked ? 'Aimé' : 'Like'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setCommentsVisible(true)}
              >
                <Ionicons name="chatbubble-outline" size={22} color={C.whiteSoft} />
                <Text style={styles.actionLabel}>Commenter</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={22} color={C.whiteSoft} />
                <Text style={styles.actionLabel}>Partager</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                onPress={handleSave}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={isSaved ? C.accent : C.whiteSoft}
                />
                <Text style={[styles.actionLabel, isSaved && { color: C.accent }]}>
                  {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
                </Text>
              </Pressable>

            </View>

          </View>
        </ScrollView>

        {/* Comments sheet */}
        <CommentsSheet
          postId={post.id}
          visible={commentsVisible}
          onClose={() => setCommentsVisible(false)}
          onCommentCountChange={(delta) => setCommentsCount(prev => Math.max(0, prev + delta))}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
    textAlign: 'center',
    marginHorizontal: 8,
  },

  scrollContent: {
    paddingBottom: 32,
  },

  postImage: {
    width: width,
    aspectRatio: 4 / 3,
    backgroundColor: '#000',
  },

  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: C.border,
    borderBottomColor: C.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 0.5,
    height: 28,
    backgroundColor: C.border,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: C.whiteFaint,
    fontWeight: '500',
    letterSpacing: 0.4,
  },

  description: {
    fontSize: 14,
    color: C.whiteSoft,
    lineHeight: 21,
    marginBottom: 10,
  },
  date: {
    fontSize: 11,
    color: C.whiteFaint,
    marginBottom: 16,
  },

  divider: {
    height: 0.5,
    backgroundColor: C.border,
    marginVertical: 16,
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  actionBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 5,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.whiteSoft,
  },
});
