import React, { memo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import type { LiveUser } from '../../context/AppContext';

const C = {
  bg: '#140102',
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.6)',
  liveRing: '#E50914',
  inactiveRing: 'rgba(255,255,255,0.2)',
};

const AVATAR_SIZE = 42;
const MONO = 'Courier';

interface UserItemProps {
  user: LiveUser;
}

const UserItem = memo(function UserItem({ user }: UserItemProps) {
  return (
    <View style={styles.item}>
      <View style={[styles.ring, user.isLive ? styles.ringLive : styles.ringInactive]}>
        <ExpoImage
          source={user.avatar}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>
      <Text style={[styles.label, user.isLive ? styles.labelLive : styles.labelInactive]} numberOfLines={1}>
        {user.isLive ? 'LIVE' : (user.lastActiveText ?? '')}
      </Text>
    </View>
  );
});

interface Props {
  users: LiveUser[];
}

function LiveStrip({ users }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {users.map(u => <UserItem key={u.id} user={u} />)}
      </ScrollView>
    </View>
  );
}

export default memo(LiveStrip);

const styles = StyleSheet.create({
  container: {
    height: 76,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  item: {
    alignItems: 'center',
    width: AVATAR_SIZE + 8,
  },
  ring: {
    width: AVATAR_SIZE + 4,
    height: AVATAR_SIZE + 4,
    borderRadius: (AVATAR_SIZE + 4) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringLive: {
    borderWidth: 2,
    borderColor: C.liveRing,
  },
  ringInactive: {
    borderWidth: 0.5,
    borderColor: C.inactiveRing,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  label: {
    marginTop: 4,
    fontSize: 9,
    fontFamily: MONO,
  },
  labelLive: {
    color: C.accent,
  },
  labelInactive: {
    color: C.whiteSoft,
  },
});
