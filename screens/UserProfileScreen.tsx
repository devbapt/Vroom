import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAppContext } from '../context';
import type { CineDrivePost } from '../context/AppContext';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GRID_GAP = 2;
const GRID_COLS = 3;
const THUMB_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const C = {
  bg: '#140102',
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.6)',
  whiteFaint: 'rgba(255,255,255,0.15)',
  cardBg: 'rgba(255,255,255,0.05)',
};

const MONO = 'Courier';

type RouteType = RouteProp<HomeStackParamList, 'UserProfile'>;

const PostThumb = memo(function PostThumb({ post }: { post: CineDrivePost }) {
  const thumb = post.photos?.[0] ?? post.image;
  return (
    <ExpoImage
      source={thumb}
      style={styles.thumb}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
  );
});

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteType>();
  const { userId, username } = route.params;
  const { cinePosts } = useAppContext();

  const userPosts = cinePosts.filter(p => p.user.id === userId);
  const samplePost = userPosts[0];
  const avatar = samplePost?.user.avatar ?? `https://i.pravatar.cc/150?u=${userId}`;

  const renderThumb = ({ item }: ListRenderItemInfo<CineDrivePost>) => (
    <PostThumb post={item} />
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={C.white} />
        </Pressable>
        <Text style={styles.headerTitle}>@{username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <ProfileHeader
            avatar={avatar}
            username={username}
            postCount={userPosts.length}
          />
        }
        renderItem={renderThumb}
        numColumns={GRID_COLS}
        columnWrapperStyle={styles.gridRow}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />
    </View>
  );
}

const ProfileHeader = memo(function ProfileHeader({
  avatar,
  username,
  postCount,
}: {
  avatar: string;
  username: string;
  postCount: number;
}) {
  return (
    <View style={styles.profileSection}>
      <ExpoImage
        source={avatar}
        style={styles.avatar}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <Text style={styles.username}>@{username}</Text>

      <View style={styles.statsRow}>
        <StatBlock label="POSTS" value={String(postCount)} />
        <View style={styles.statDivider} />
        <StatBlock label="FOLLOWERS" value="—" />
        <View style={styles.statDivider} />
        <StatBlock label="FOLLOWING" value="—" />
      </View>

      <Pressable style={styles.followBtn}>
        <Text style={styles.followBtnText}>SUIVRE</Text>
      </Pressable>

      <View style={styles.sectionLabel}>
        <View style={styles.accentBar} />
        <Text style={styles.sectionLabelText}>POSTS</Text>
      </View>
    </View>
  );
});

const StatBlock = memo(function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="camera-outline" size={40} color={C.whiteFaint} />
      <Text style={styles.emptyText}>Aucun post pour le moment</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
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
    borderBottomColor: C.whiteFaint,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.white,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 32,
  },

  // Profile section
  profileSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: C.accent,
    marginBottom: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: C.white,
  },
  statLabel: {
    fontFamily: MONO,
    fontSize: 8,
    letterSpacing: 1.5,
    color: C.whiteSoft,
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: C.whiteFaint,
  },
  followBtn: {
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 4,
    paddingHorizontal: 32,
    paddingVertical: 8,
    marginBottom: 28,
  },
  followBtnText: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    color: C.accent,
    fontWeight: '600',
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  accentBar: {
    width: 3,
    height: 16,
    borderRadius: 1.5,
    backgroundColor: C.accent,
  },
  sectionLabelText: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    color: C.whiteSoft,
  },

  // Grid
  gridRow: {
    gap: GRID_GAP,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: C.cardBg,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: MONO,
    fontSize: 12,
    color: C.whiteFaint,
    letterSpacing: 1,
  },
});
