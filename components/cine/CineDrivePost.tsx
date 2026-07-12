import React, { memo, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ChapterCard from './ChapterCard';
import ActionStack from './ActionStack';
import HUDStrip from './HUDStrip';
import ExpandableText from '../ui/ExpandableText';
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

  // Double-tap to like
  const lastTapRef = useRef<number>(0);
  const heartAnim = useRef(new Animated.Value(0)).current;

  const showHeartAnim = useCallback(() => {
    heartAnim.setValue(0);
    Animated.sequence([
      Animated.spring(heartAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
      Animated.delay(500),
      Animated.timing(heartAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [heartAnim]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (!post.isLiked) onLike(post.id);
      showHeartAnim();
    }
    lastTapRef.current = now;
  }, [post.id, post.isLiked, onLike, showHeartAnim]);

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
          <Pressable key={i} onPress={handleTap} style={{ width: SCREEN_WIDTH, height: postHeight }}>
            <ExpoImage
              source={photo}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={i === 0 ? 200 : 0}
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* Animation cœur double-tap */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.heartOverlay,
          {
            opacity: heartAnim,
            transform: [{ scale: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          },
        ]}
      >
        <Ionicons name="heart" size={90} color={C.accent} />
      </Animated.View>

      {/* Readability gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Chapter card — sits below the page indicator dots */}
      <ChapterCard
        type={post.type}
        index={index}
        location={post.location}
        buildPhase={buildPhase}
        topOffset={chapterTopOffset !== undefined ? chapterTopOffset + 18 : undefined}
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

      {/* Bloc auteur + description — empilés avec un écart fixe et minimal */}
      <View style={styles.bottomTextBlock} pointerEvents="box-none">
        <AuthorBlock post={post} onUserPress={onUserPress} />
        {post.description ? (
          <ExpandableText
            text={post.description}
            numberOfLines={2}
            style={styles.descriptionText}
          />
        ) : null}
      </View>

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
  heartOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Bloc auteur + description — un seul conteneur positionné, empilé avec un
  // écart fixe (gap) pour que l'espacement reste minimal quelle que soit la
  // longueur de la description (1 ou 2 lignes).
  bottomTextBlock: {
    position: 'absolute',
    bottom: 88,
    left: 18,
    right: 70,
    gap: 4,
  },
  descriptionText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: C.white,
  },

  // Author Block
  authorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    maxWidth: '100%',
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

    fontSize: 10,
    letterSpacing: 0.3,
    color: C.whiteSoft,
    marginTop: 2,
  },
});
