import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import StoryViewer from '../../screens/StoryViewer';
import { useAppContext } from '../../context';
import type { FeedStory } from '../../context/AppContext';

const BAR_HEIGHT = 92;
const AVATAR_SIZE = 60;

const C = {
  bg: '#140102',
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.7)',
  ringUnseen: '#E50914',
  ringSeen: 'rgba(255,255,255,0.25)',
  addBadgeBg: '#E50914',
};

const MONO = 'Courier';

// ─── Story Avatar Item ────────────────────────────────────────────────────────

interface StoryItemProps {
  story: FeedStory;
  isSeen: boolean;
  onPress: (story: FeedStory) => void;
}

const StoryItem = memo(function StoryItem({ story, isSeen, onPress }: StoryItemProps) {
  return (
    <Pressable style={styles.storyItem} onPress={() => onPress(story)} hitSlop={4}>
      <View style={[styles.avatarRing, { borderColor: isSeen ? C.ringSeen : C.ringUnseen }]}>
        <ExpoImage
          source={story.avatar}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>
      <Text style={styles.storyLabel} numberOfLines={1}>
        @{story.username}
      </Text>
    </Pressable>
  );
});

// ─── My Story Item ────────────────────────────────────────────────────────────

interface MyStoryItemProps {
  avatar: string;
  hasActiveStory: boolean;
  onPress: () => void;
}

const MyStoryItem = memo(function MyStoryItem({ avatar, hasActiveStory, onPress }: MyStoryItemProps) {
  return (
    <Pressable style={styles.storyItem} onPress={onPress} hitSlop={4}>
      <View style={styles.myStoryWrapper}>
        <View style={[
          styles.avatarRing,
          hasActiveStory
            ? { borderColor: C.ringUnseen }
            : { borderColor: 'transparent', borderWidth: 0 },
        ]}>
          <ExpoImage
            source={avatar}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>
        {!hasActiveStory && (
          <View style={styles.addBadge}>
            <Ionicons name="add" size={12} color={C.white} />
          </View>
        )}
      </View>
      <Text style={styles.storyLabel} numberOfLines={1}>
        Ma story
      </Text>
    </Pressable>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default memo(function StoriesBar() {
  const { feedStories, markStoryAsViewed, user } = useAppContext();

  const [viewerVisible, setViewerVisible]     = useState(false);
  const [viewerHighlightId, setViewerHighlightId] = useState('');
  const [viewerStories, setViewerStories]     = useState<{ id: string; image: string }[]>([]);

  const currentUserId = user?.id ?? 'user_123';
  const currentAvatar = user?.avatar ?? '';

  const myStory = feedStories.find(s => s.userId === currentUserId);
  const otherStories = feedStories.filter(s => s.userId !== currentUserId);

  const openStory = useCallback((story: FeedStory) => {
    markStoryAsViewed(story.id);
    setViewerHighlightId(story.id);
    setViewerStories([{ id: story.id, image: story.imageUrl }]);
    setViewerVisible(true);
  }, [markStoryAsViewed]);

  const openMyStory = useCallback(() => {
    if (myStory) {
      openStory(myStory);
    }
    // If no story, navigate to CreateStory (handled by parent via onCreateStory prop if needed)
  }, [myStory, openStory]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* My story always first */}
        <MyStoryItem
          avatar={currentAvatar}
          hasActiveStory={!!myStory}
          onPress={openMyStory}
        />

        {/* Other users' stories */}
        {otherStories.map(story => {
          const isSeen = story.viewedBy.includes(currentUserId);
          return (
            <StoryItem
              key={story.id}
              story={story}
              isSeen={isSeen}
              onPress={openStory}
            />
          );
        })}
      </ScrollView>

      {/* StoryViewer embedded as modal */}
      <StoryViewer
        visible={viewerVisible}
        highlightId={viewerHighlightId}
        onClose={() => setViewerVisible(false)}
        stories={viewerStories}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: BAR_HEIGHT,
    backgroundColor: C.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    alignItems: 'center',
  },

  storyItem: {
    alignItems: 'center',
    width: AVATAR_SIZE + 8,
  },
  myStoryWrapper: {
    position: 'relative',
  },
  avatarRing: {
    width: AVATAR_SIZE + 4,
    height: AVATAR_SIZE + 4,
    borderRadius: (AVATAR_SIZE + 4) / 2,
    borderWidth: 2.5,
    borderColor: C.ringUnseen,
    padding: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.addBadgeBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.bg,
  },
  storyLabel: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 0.5,
    color: C.whiteSoft,
    marginTop: 5,
    maxWidth: AVATAR_SIZE + 8,
    textAlign: 'center',
  },
});
