import React, { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import IconVroom from '../../assets/icon_vroom_Couleur.svg';
import TypoVroom from '../../assets/typo_vroom_Blanc.svg';

const HEADER_HEIGHT = 56;

const C = {
  bg: '#140102',
  white: '#FFFFFF',
  circleBorder: 'rgba(255,255,255,0.5)',
};

interface Props {
  onAddPress?: () => void;
}

function HomeHeader({ onAddPress }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <IconVroom width={30} height={30} />
        <TypoVroom width={76} height={22} style={styles.typo} />
      </View>
      <Pressable
        style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
        onPress={onAddPress}
        hitSlop={10}
      >
        <Ionicons name="add" size={20} color={C.white} />
      </Pressable>
    </View>
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
    backgroundColor: C.bg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
