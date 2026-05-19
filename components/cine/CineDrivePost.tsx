import React, { memo, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ChapterCard from './ChapterCard';
import ActionStack from './ActionStack';
import HUDStrip from './HUDStrip';
import type { CineDrivePost as CineDrivePostType } from '../../context/AppContext';
import type { BuildHUD } from '../../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.6)',
  pageActive: '#E50914',
  pageInactive: 'rgba(255,255,255,0.25)',
};

const MONO = 'Courier';

// ─── Page Indicator ──────────────────────────────────────────────────────────

interface PageIndicatorProps {
  count: number;
  activeIndex: number;
  top?: number;
}

const PageIndicator = memo(function PageIndicator({ count, activeIndex, top }: PageIndicatorProps) {
  return (
    <View style={[styles.pageIndicator, top !== undefined && { top }]}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.pageTick,
            i === activeIndex ? styles.pageTickActive : styles.pageTickInactive,
          ]}
        />
      ))}
    </View>
  );
});

// ─── Author Block ─────────────────────────────────────────────────────────────

interface AuthorBlockProps {
  post: CineDrivePostType;
  onUserPress?: (userId: string, username: string) => void;
}

const AuthorBlock = memo(function AuthorBlock({ post, onUserPress }: AuthorBlockProps) {
  const vehicleLine = [post.vehicle.brand, post.vehicle.model, post.vehicle.year]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.authorBlock}>
      <Pressable onPress={() => onUserPress?.(post.user.id, post.user.username)} hitSlop={4}>
        <ExpoImage
          source={post.user.avatar}
          style={styles.authorAvatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </Pressable>
      <View style={styles.authorText}>
        <Pressable
          onPress={() => onUserPress?.(post.user.id, post.user.username)}
          hitSlop={8}
        >
          <Text style={styles.authorUsername}>@{post.user.username}</Text>
        </Pressable>
        <Text style={styles.authorVehicle} numberOfLines={1}>{vehicleLine}</Text>
      </View>
    </View>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  post: CineDrivePostType;
  index: number;
  postHeight: number;
  chapterTopOffset?: number;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onComment?: (postId: string) => void;
  onUserPress?: (userId: string, username: string) => void;
}

function CineDrivePost({ post, index, postHeight, chapterTopOffset, onLike, onSave, onComment, onUserPress }: Props) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const photos = post.photos && post.photos.length > 0 ? post.photos : [post.image];
  const hasMultiplePhotos = photos.length > 1;

  const buildPhase = post.hud.kind === 'build'
    ? (post.hud as BuildHUD).phase
    : undefined;

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== activePhotoIndex) {
      setActivePhotoIndex(newIndex);
    }
  }, [activePhotoIndex]);

  return (
    <View style={[styles.container, { height: postHeight }]}>
      {/* Photo carousel */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        style={StyleSheet.absoluteFill}
        scrollEnabled={hasMultiplePhotos}
      >
        {photos.map((photo, i) => (
          <ExpoImage
            key={i}
            source={photo}
            style={{ width: SCREEN_WIDTH, height: postHeight }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={i === 0 ? 200 : 0}
          />
        ))}
      </ScrollView>

      {/* Readability gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Chapter card — top left */}
      <ChapterCard
        type={post.type}
        index={index}
        location={post.location}
        buildPhase={buildPhase}
        topOffset={chapterTopOffset}
      />

      {/* Photo counter — horizontal dots below overlay */}
      {hasMultiplePhotos && (
        <PageIndicator count={photos.length} activeIndex={activePhotoIndex} top={chapterTopOffset} />
      )}

      {/* Action stack — right side */}
      <ActionStack
        postId={post.id}
        likes={post.likes}
        isLiked={post.isLiked}
        comments={post.comments}
        isSaved={post.isSaved}
        onLike={onLike}
        onSave={onSave}
        onComment={onComment}
      />

      {/* Author block — bottom left */}
      <AuthorBlock post={post} onUserPress={onUserPress} />

      {/* HUD strip — bottom */}
      <HUDStrip type={post.type} hud={post.hud} />
    </View>
  );
}

export default memo(CineDrivePost);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#140102',
    overflow: 'hidden',
  },

  // Page Indicator — horizontal dots centered at top
  pageIndicator: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  pageTick: {
    height: 2.5,
    borderRadius: 2,
  },
  pageTickActive: {
    width: 22,
    backgroundColor: C.pageActive,
  },
  pageTickInactive: {
    width: 7,
    backgroundColor: C.pageInactive,
  },

  // Author Block
  authorBlock: {
    position: 'absolute',
    bottom: 118,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '65%',
  },
  authorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: C.accent,
  },
  authorText: {
    flex: 1,
  },
  authorUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: C.white,
  },
  authorVehicle: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 0.3,
    color: C.whiteSoft,
    marginTop: 2,
  },
});
