import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import StoryViewer from '../../screens/StoryViewer';
import { useAppContext } from '../../context';
import { supabase } from '../../supabaseClient';
import type { FeedStory } from '../../context/AppContext';

const BAR_HEIGHT = 72;
const AVATAR_SIZE = 50;

const C = {
  bg: '#140102',
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.7)',
  ringUnseen: '#E50914',
  ringSeen: 'rgba(255,255,255,0.25)',
};

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default memo(function StoriesBar() {
  const { feedStories, markStoryAsViewed, removeFeedStory, user } = useAppContext();

  const [viewerVisible, setViewerVisible]     = useState(false);
  const [viewerHighlightId, setViewerHighlightId] = useState('');
  const [viewerStories, setViewerStories]     = useState<{ id: string; image: string; userId?: string }[]>([]);

  const currentUserId = user?.id ?? '';

  const otherStories = feedStories.filter(s => s.userId !== currentUserId);

  const openStory = useCallback((story: FeedStory) => {
    markStoryAsViewed(story.id);
    setViewerHighlightId(story.id);
    setViewerStories([{ id: story.id, image: story.imageUrl, userId: story.userId }]);
    setViewerVisible(true);
  }, [markStoryAsViewed]);

  if (otherStories.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

      <StoryViewer
        visible={viewerVisible}
        highlightId={viewerHighlightId}
        onClose={() => setViewerVisible(false)}
        stories={viewerStories}
        currentUserId={user?.id}
        onStoryDelete={(id) => { removeFeedStory(id); setViewerVisible(false); }}
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
    paddingVertical: 4,
    gap: 12,
    alignItems: 'center',
  },

  storyItem: {
    alignItems: 'center',
    width: AVATAR_SIZE + 8,
  },
  avatarRing: {
    width: AVATAR_SIZE + 4,
    height: AVATAR_SIZE + 4,
    borderRadius: (AVATAR_SIZE + 4) / 2,
    borderWidth: 2.5,
    overflow: 'hidden',
  },
  avatar: {
    flex: 1,
  },
  storyLabel: {

    fontSize: 9,
    letterSpacing: 0.5,
    color: C.whiteSoft,
    marginTop: 4,
    maxWidth: AVATAR_SIZE + 8,
    textAlign: 'center',
  },
});
