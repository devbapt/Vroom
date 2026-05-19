import { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';
import HomeHeader from '../components/cine/HomeHeader';
import StoriesBar from '../components/cine/StoriesBar';
import CineDrivePost from '../components/cine/CineDrivePost';
import StoryViewer from './StoryViewer';
import CommentsSheet from './CommentsSheet';
import type { CineDrivePost as CineDrivePostData, AnyHUD } from '../context/AppContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TAB_BAR_HEIGHT = 60;

function mapRowToPost(row: any, savedIds: Set<string>, likedIds: Set<string>): CineDrivePostData {
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
    isLiked: likedIds.has(row.id),
    comments: row.comments_count ?? 0,
    isSaved: savedIds.has(row.id),
    createdAt: row.created_at,
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { feedStories, markStoryAsViewed, removeFeedStory, user, toggleSaveCinePost, deletedPostIds } = useAppContext();

  const [posts, setPosts] = useState<CineDrivePostData[]>([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [viewerHighlightId, setViewerHighlightId] = useState('');
  const [viewerStories, setViewerStories] = useState<{ id: string; image: string; userId?: string }[]>([]);
  const [commentsPostId, setCommentsPostId] = useState('');
  const [commentsVisible, setCommentsVisible] = useState(false);

  const myStory = feedStories.find(s => s.userId === (user?.id ?? ''));

  // Hauteur réelle du FlatList mesurée à l'exécution (pas d'approximation avec les insets)
  const [listHeight, setListHeight] = useState(
    SCREEN_HEIGHT - insets.top - TAB_BAR_HEIGHT - insets.bottom
  );
  const postHeight = listHeight;

  // ── Fetch feed posts from Supabase ────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const fetchPosts = async () => {
      const userId = user?.id;

      // Fetch saved + liked post IDs for current user
      const savedIdsSet = new Set<string>();
      const likedIdsSet = new Set<string>();
      if (userId) {
        const [savedRes, likedRes] = await Promise.all([
          supabase.from('saved_posts').select('post_id').eq('user_id', userId),
          supabase.from('post_likes').select('post_id').eq('user_id', userId),
        ]);
        (savedRes.data ?? []).forEach((r: any) => savedIdsSet.add(r.post_id));
        (likedRes.data ?? []).forEach((r: any) => likedIdsSet.add(r.post_id));
      }

      // Two queries: official vroom posts + current user's posts
      const [vroomRes, userRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*, profiles!user_id(id, username, full_name, avatar_url)')
          .eq('profiles.username', 'vroom')
          .order('created_at', { ascending: false })
          .limit(30),
        userId
          ? supabase
              .from('posts')
              .select('*, profiles!user_id(id, username, full_name, avatar_url)')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(30)
          : Promise.resolve({ data: [] }),
      ]);

      if (cancelled) return;

      const allRows: any[] = [...(vroomRes.data ?? []), ...(userRes.data ?? [])];
      const seen = new Set<string>();
      const unique = allRows.filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      unique.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPosts(unique.map(r => mapRowToPost(r, savedIdsSet, likedIdsSet)));
    };

    fetchPosts();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (deletedPostIds.length === 0) return;
    setPosts(prev => prev.filter(p => !deletedPostIds.includes(p.id)));
  }, [deletedPostIds]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleAddPress = useCallback(() => {
    navigation.navigate('CreatePost');
  }, [navigation]);

  const handleUserPress = useCallback((userId: string, username: string) => {
    navigation.navigate('UserProfile', { userId, username });
  }, [navigation]);

  const handleMyStoryPress = useCallback(() => {
    if (myStory) {
      markStoryAsViewed(myStory.id);
      setViewerHighlightId(myStory.id);
      setViewerStories([{ id: myStory.id, image: myStory.imageUrl, userId: myStory.userId }]);
      setStoryViewerVisible(true);
    } else {
      navigation.navigate('CreateStory');
    }
  }, [myStory, markStoryAsViewed, navigation]);

  const handleOpenComments = useCallback((postId: string) => {
    setCommentsPostId(postId);
    setCommentsVisible(true);
  }, []);

  const handleToggleLike = useCallback(async (postId: string) => {
    let currentlyLiked = false;
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      currentlyLiked = p.isLiked;
      return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
    }));
    if (!user?.id) return;
    if (currentlyLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    }
  }, [user?.id]);

  const handleToggleSave = useCallback((postId: string) => {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p)
    );
    toggleSaveCinePost(postId);
  }, [toggleSaveCinePost]);

  // ChapterCard sits just below the HomeHeader bar (56px)
  const chapterTopOffset = insets.top + 56 + 4;

  const renderPost = useCallback(
    ({ item, index }: ListRenderItemInfo<CineDrivePostData>) => (
      <CineDrivePost
        post={item}
        index={index}
        postHeight={postHeight}
        chapterTopOffset={chapterTopOffset}
        onLike={handleToggleLike}
        onSave={handleToggleSave}
        onComment={handleOpenComments}
        onUserPress={handleUserPress}
      />
    ),
    [postHeight, chapterTopOffset, handleToggleLike, handleToggleSave, handleOpenComments, handleUserPress]
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Feed plein écran */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        pagingEnabled
        snapToInterval={postHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
        getItemLayout={(_, index) => ({
          length: postHeight,
          offset: postHeight * index,
          index,
        })}
      />

      {/* Header + StoriesBar flottants par-dessus le feed */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
        <HomeHeader
          onAddPress={handleAddPress}
          userAvatar={user?.avatar}
          hasActiveStory={!!myStory}
          onMyStoryPress={handleMyStoryPress}
        />
        <StoriesBar />
      </View>

      <StoryViewer
        visible={storyViewerVisible}
        highlightId={viewerHighlightId}
        onClose={() => setStoryViewerVisible(false)}
        stories={viewerStories}
        currentUserId={user?.id}
        onStoryDelete={(id) => { removeFeedStory(id); setStoryViewerVisible(false); }}
      />

      <CommentsSheet
        postId={commentsPostId}
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        onCommentCountChange={(delta) => {
          setPosts(prev =>
            prev.map(p => p.id === commentsPostId
              ? { ...p, comments: Math.max(0, p.comments + delta) }
              : p
            )
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#140102',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
