import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const C = {
  accent: '#E50914',
  white: '#FFFFFF',
  whiteFaint: 'rgba(255,255,255,0.25)',
  btnBg: 'rgba(0,0,0,0.4)',
  btnBorder: 'rgba(255,255,255,0.15)',
};

const MONO = 'Courier';

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

interface ActionBtnProps {
  onPress?: () => void;
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
}

const ActionBtn = memo(function ActionBtn({ onPress, icon, label, subLabel }: ActionBtnProps) {
  return (
    <View style={styles.btnWrapper}>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
        onPress={onPress}
        hitSlop={6}
      >
        {icon}
      </Pressable>
      <Text style={styles.counter}>{label}</Text>
      {subLabel ? <Text style={styles.subLabel}>{subLabel}</Text> : null}
    </View>
  );
});

interface Props {
  postId: string;
  likes: number;
  isLiked: boolean;
  comments: number;
  isSaved: boolean;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onComment?: (postId: string) => void;
}

function ActionStack({ postId, likes, isLiked, comments, isSaved, onLike, onSave, onComment }: Props) {
  const handleLike    = useCallback(() => onLike(postId), [onLike, postId]);
  const handleSave    = useCallback(() => onSave(postId), [onSave, postId]);
  const handleComment = useCallback(() => onComment?.(postId), [onComment, postId]);

  return (
    <View style={styles.container}>
      <ActionBtn
        onPress={handleLike}
        icon={
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? C.accent : C.white}
          />
        }
        label={formatCount(likes)}
      />
      <ActionBtn
        onPress={handleComment}
        icon={<Feather name="message-square" size={20} color={C.white} />}
        label={formatCount(comments)}
      />
      <ActionBtn
        onPress={handleSave}
        icon={
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isSaved ? C.accent : C.white}
          />
        }
        label=""
      />
      <ActionBtn
        icon={<Feather name="volume-x" size={18} color={C.white} />}
        label=""
        subLabel="MUTED"
      />
    </View>
  );
}

export default memo(ActionStack);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 14,
    bottom: 150,
    alignItems: 'center',
    gap: 22,
  },
  btnWrapper: {
    alignItems: 'center',
  },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.btnBg,
    borderWidth: 0.5,
    borderColor: C.btnBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    fontFamily: MONO,
    fontSize: 9,
    color: C.white,
    marginTop: 3,
  },
  subLabel: {
    fontFamily: MONO,
    fontSize: 8,
    color: C.whiteFaint,
    marginTop: 1,
  },
});
