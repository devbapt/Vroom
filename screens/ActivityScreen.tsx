import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';
import { getTranslation } from '../i18n';

// --- Colors ---
const VROOM_COLORS = {
  bg:      '#140102',
  dark:    '#140102',
  accent:  '#E50914',
  muted:   'rgba(255,255,255,0.45)',
  fieldBg: '#1F0808',
  border:  'rgba(255,255,255,0.12)',
  white:   '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.7)',
};

const CONTAINER_PADDING = 16;

type NotificationType = 'like' | 'comment' | 'follow';

interface ActivityItem {
  id: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  actor: { id: string; username: string; avatarUrl: string };
  post?: { id: string; brand: string; model: string; type: string; imageUrl: string; description: string | null; createdAt: string };
}

type ActivityScreenProps = {
  navigation: any;
};

function timeAgo(dateStr: string, t: ReturnType<typeof getTranslation>['activity']) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t.just_now;
  if (minutes < 60) return `${minutes}${t.minutes_suffix}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t.hours_suffix}`;
  const days = Math.floor(hours / 24);
  return `${days}${t.days_suffix}`;
}

export default function ActivityScreen({ navigation }: ActivityScreenProps) {
  const { language, user } = useAppContext();
  const t = getTranslation(language);

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select(`
        id, type, created_at, is_read,
        actor:profiles!actor_id(id, username, avatar_url),
        post:posts(id, brand, model, type, image_urls, description, created_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setItems((data ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      createdAt: row.created_at,
      isRead: row.is_read,
      actor: {
        id: row.actor?.id ?? '',
        username: row.actor?.username ?? '',
        avatarUrl: row.actor?.avatar_url ?? '',
      },
      post: row.post ? {
        id: row.post.id,
        brand: row.post.brand ?? '',
        model: row.post.model ?? '',
        type: row.post.type ?? '',
        imageUrl: row.post.image_urls?.[0] ?? '',
        description: row.post.description,
        createdAt: row.post.created_at,
      } : undefined,
    })));
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchActivity();
      if (user?.id) {
        supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      }
    }, [fetchActivity, user?.id])
  );

  const handlePress = useCallback((item: ActivityItem) => {
    if (item.type === 'follow') {
      navigation.navigate('UserProfile', { userId: item.actor.id, username: item.actor.username });
      return;
    }
    if (item.post) {
      navigation.navigate('PostDetail', {
        id: item.post.id,
        name: [item.post.brand, item.post.model].filter(Boolean).join(' ') || item.post.type,
        image: item.post.imageUrl,
        description: item.post.description ?? undefined,
        date: item.post.createdAt ? new Date(item.post.createdAt).toLocaleDateString('fr-FR') : undefined,
      });
    }
  }, [navigation]);

  const getActivityIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':    return <Ionicons name="heart" size={20} color={VROOM_COLORS.accent} />;
      case 'follow':  return <Ionicons name="person-add" size={20} color={VROOM_COLORS.accent} />;
      case 'comment': return <Ionicons name="chatbubble" size={20} color={VROOM_COLORS.accent} />;
    }
  };

  const getActionText = (type: NotificationType) => {
    switch (type) {
      case 'like':    return t.activity.liked_your_post;
      case 'comment': return t.activity.commented_on_your_post;
      case 'follow':  return t.activity.started_following_you;
    }
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <Pressable
      style={({ pressed }) => [styles.activityItem, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
      onPress={() => handlePress(item)}
    >
      <View style={styles.activityIcon}>
        {item.actor.avatarUrl ? (
          <ExpoImage source={item.actor.avatarUrl} style={styles.activityAvatar} contentFit="cover" />
        ) : (
          getActivityIcon(item.type)
        )}
      </View>

      <View style={styles.activityContent}>
        <Text style={styles.activityUser}>@{item.actor.username}</Text>
        <Text style={styles.activityAction}>{getActionText(item.type)}</Text>
        <Text style={styles.activityTime}>{timeAgo(item.createdAt, t.activity)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={VROOM_COLORS.muted} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* === HEADER === */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="chevron-down" size={32} color={VROOM_COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.activity.title}</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* === ACTIVITY LIST === */}
      {loading ? (
        <ActivityIndicator color={VROOM_COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderActivityItem}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={48} color={VROOM_COLORS.muted} />
              <Text style={styles.emptyTitle}>{t.activity.empty_title}</Text>
              <Text style={styles.emptySubtitle}>{t.activity.empty_subtitle}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VROOM_COLORS.bg,
  },

  // === HEADER ===
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: VROOM_COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: VROOM_COLORS.white,
  },

  // === LIST ===
  listContent: {
    paddingVertical: 0,
    flexGrow: 1,
  },

  // === ACTIVITY ITEM ===
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 14,
    gap: 12,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  activityAvatar: {
    width: 44,
    height: 44,
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    fontSize: 14,
    fontWeight: '600',
    color: VROOM_COLORS.white,
    marginBottom: 2,
  },
  activityAction: {
    fontSize: 13,
    color: VROOM_COLORS.muted,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: VROOM_COLORS.muted,
    fontWeight: '400',
  },

  // === DIVIDER ===
  divider: {
    height: 0.5,
    backgroundColor: VROOM_COLORS.border,
    marginHorizontal: CONTAINER_PADDING,
  },

  // === EMPTY ===
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: VROOM_COLORS.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: VROOM_COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
