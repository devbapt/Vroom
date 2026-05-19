import React, { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import IconVroom from '../../assets/icon_vroom_Couleur.svg';
import TypoVroom from '../../assets/typo_vroom_Blanc.svg';

const HEADER_HEIGHT = 56;
const AVATAR_SIZE = 40;

const C = {
  bg: '#140102',
  white: '#FFFFFF',
  circleBorder: 'rgba(255,255,255,0.5)',
  accent: '#E50914',
  ringSeen: 'rgba(255,255,255,0.25)',
};

interface Props {
  onAddPress?: () => void;
  userAvatar?: string;
  hasActiveStory?: boolean;
  onMyStoryPress?: () => void;
}

function HomeHeader({ onAddPress, userAvatar, hasActiveStory, onMyStoryPress }: Props) {
  return (
    <BlurView intensity={20} tint="dark" style={styles.container}>
      {/* Left: Ma story bubble */}
      <Pressable onPress={onMyStoryPress} style={styles.storyWrapper} hitSlop={8}>
        <View style={[
          styles.avatarRing,
          { borderColor: hasActiveStory ? C.accent : C.ringSeen },
        ]}>
          {userAvatar ? (
            <ExpoImage
              source={userAvatar}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.45)" />
            </View>
          )}
        </View>
        <View style={styles.addBadge}>
          <Ionicons name="add" size={10} color={C.white} />
        </View>
      </Pressable>

      {/* Right: Logo + Add button */}
      <View style={styles.rightSection}>
        <View style={styles.logoRow}>
          <IconVroom width={26} height={26} />
          <TypoVroom width={66} height={19} style={styles.typo} />
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
          onPress={onAddPress}
          hitSlop={10}
        >
          <Ionicons name="add" size={20} color={C.white} />
        </Pressable>
      </View>
    </BlurView>
  );
}

export default memo(HomeHeader);

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  storyWrapper: {
    position: 'relative',
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatar: { flex: 1 },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  addBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.bg,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typo: {
    marginTop: 1,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.circleBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
