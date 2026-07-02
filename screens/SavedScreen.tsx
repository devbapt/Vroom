import React, { memo, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  ListRenderItemInfo,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context';
import { supabase } from '../supabaseClient';
import type { CineDrivePost, AnyHUD } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  bg: '#140102',
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.6)',
  whiteFaint: 'rgba(255,255,255,0.15)',
  surface: 'rgba(255,255,255,0.05)',
};

const MONO = 'Courier';
const GRID_GAP = 2;
const GRID_COLS = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP) / GRID_COLS;

type SavedScreenProps = { navigation: any };

function mapRowToSaved(row: any): CineDrivePost {
  const profile = row.profiles ?? {};
  const imageUrls: string[] = row.image_urls ?? [];
  return {
    id: row.id,
    type: row.type,
    user: {
      id: profile.id ?? row.user_id,
      username: profile.username ?? '',
      avatar: profile.avatar_url ?? '',
    },
    vehicle: {
      brand: row.brand ?? '',
      model: row.model ?? '',
      year: row.year ?? undefined,
    },
    location: row.location ?? undefined,
    image: imageUrls[0] ?? '',
    photos: imageUrls,
    pages: imageUrls.map((_: string, i: number) => ({ id: `pg${i + 1}`, type: 'photo' as const })),
    hud: (row.hud_data as AnyHUD) ?? ({ kind: 'daily', power: '—', acceleration: '—', transmission: '—' } as AnyHUD),
    description: row.description ?? undefined,
    likes: row.likes_count ?? 0,
    isLiked: false,
    comments: row.comments_count ?? 0,
    isSaved: true,
    createdAt: row.created_at,
  };
}

const SavedItem = memo(function SavedItem({ item, onUnsave, onPress }: { item: CineDrivePost; onUnsave: (id: string) => void; onPress: (item: CineDrivePost) => void }) {
  const thumb = item.photos?.[0] ?? item.image;
  return (
    <Pressable style={({ pressed }) => [styles.item, pressed && { opacity: 0.85 }]} onPress={() => onPress(item)}>
      <ExpoImage
        source={thumb}
        style={styles.itemImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.itemOverlay}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{item.type.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Pressable
          style={styles.unsaveBtn}
          onPress={() => onUnsave(item.id)}
          hitSlop={8}
        >
          <Ionicons name="bookmark" size={16} color={C.accent} />
        </Pressable>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemVehicle} numberOfLines={1}>
          {item.vehicle.brand} {item.vehicle.model}
        </Text>
        <Text style={styles.itemUser} numberOfLines={1}>
          @{item.user.username}
        </Text>
        <View style={styles.likeRow}>
          <Ionicons name="heart" size={11} color={C.accent} />
          <Text style={styles.likeCount}>{item.likes >= 1000 ? (item.likes / 1000).toFixed(1) + 'k' : item.likes}</Text>
        </View>
      </View>
    </Pressable>
  );
});

export default function SavedScreen({ navigation }: SavedScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAppContext();

  const [savedPosts, setSavedPosts] = useState<CineDrivePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      const { data: savedRows } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const ids = (savedRows ?? []).map((r: any) => r.post_id);
      if (ids.length === 0) {
        if (!cancelled) { setSavedPosts([]); setLoading(false); }
        return;
      }

      const { data: posts } = await supabase
        .from('posts')
        .select('*, profiles!user_id(id, username, full_name, avatar_url)')
        .in('id', ids);

      if (!cancelled) {
        setSavedPosts((posts ?? []).map(mapRowToSaved));
        setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleUnsave = useCallback(async (postId: string) => {
    setSavedPosts(prev => prev.filter(p => p.id !== postId));
    if (user?.id) {
      await supabase.from('saved_posts').delete()
        .eq('post_id', postId).eq('user_id', user.id);
    }
  }, [user?.id]);

  const handleOpenPost = useCallback((item: CineDrivePost) => {
    navigation.navigate('PostDetail', {
      id: item.id,
      name: [item.vehicle.brand, item.vehicle.model].filter(Boolean).join(' ') || item.type,
      image: item.photos?.[0] ?? item.image,
      description: item.description,
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : undefined,
    });
  }, [navigation]);

  const renderItem = ({ item }: ListRenderItemInfo<CineDrivePost>) => (
    <SavedItem item={item} onUnsave={handleUnsave} onPress={handleOpenPost} />
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="chevron-down" size={28} color={C.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.accentBar} />
          <Text style={styles.headerTitle}>ENREGISTRÉS</Text>
        </View>
        <Text style={styles.headerCount}>{savedPosts.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={savedPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={GRID_COLS}
          columnWrapperStyle={styles.gridRow}
          ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
          contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
        />
      )}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="bookmark-outline" size={48} color={C.whiteFaint} />
      <Text style={styles.emptyTitle}>Aucun post enregistré</Text>
      <Text style={styles.emptySubtitle}>
        Appuie sur{' '}
        <Ionicons name="bookmark-outline" size={12} color={C.whiteSoft} />
        {' '}dans le feed pour sauvegarder des posts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: C.whiteFaint,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentBar: {
    width: 3,
    height: 16,
    borderRadius: 1.5,
    backgroundColor: C.accent,
  },
  headerTitle: {
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: 2,
    color: C.white,
    fontWeight: '600',
  },
  headerCount: {
    fontFamily: MONO,
    fontSize: 12,
    color: C.whiteSoft,
    minWidth: 28,
    textAlign: 'right',
  },

  // Grid
  gridContent: {
    paddingTop: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
  },

  // Item
  item: {
    width: ITEM_SIZE,
    backgroundColor: C.surface,
  },
  itemImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.3,
  },
  itemOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(20,1,2,0.75)',
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  typeBadgeText: {
    fontFamily: MONO,
    fontSize: 7,
    letterSpacing: 1,
    color: C.white,
    fontWeight: '600',
  },
  unsaveBtn: {
    backgroundColor: 'rgba(20,1,2,0.75)',
    borderRadius: 3,
    padding: 5,
  },
  itemInfo: {
    padding: 10,
    paddingTop: 8,
    gap: 2,
  },
  itemVehicle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  itemUser: {
    fontFamily: MONO,
    fontSize: 10,
    color: C.whiteSoft,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  likeCount: {
    fontFamily: MONO,
    fontSize: 9,
    color: C.whiteSoft,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: MONO,
    fontSize: 11,
    color: C.whiteSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
});
