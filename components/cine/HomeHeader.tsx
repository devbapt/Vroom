import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import IconVroom from '../../assets/icon_vroom_Couleur.svg';
import TypoVroom from '../../assets/typo_vroom_Blanc.svg';

const HEADER_HEIGHT = 56;

const C = {
  white: '#FFFFFF',
  circleBorder: 'rgba(255,255,255,0.5)',
};

interface Props {
  onAddPress?: () => void;
  topInset?: number;
}

function HomeHeader({ onAddPress, topInset = 0 }: Props) {
  return (
    // Le BlurView part du bord y=0 pour couvrir la zone du notch / Dynamic Island
    <BlurView
      intensity={60}
      tint="dark"
      style={[styles.container, { height: HEADER_HEIGHT + topInset }]}
    >
      {/* Contenu décalé sous la safe area */}
      <View style={[styles.inner, { paddingTop: topInset }]}>
        {/* Gauche : logo (icon + wordmark) */}
        <View style={styles.logoRow}>
          <IconVroom width={26} height={26} />
          <TypoVroom width={66} height={19} style={styles.typo} />
        </View>

        {/* Droite : bouton + rond outlined */}
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
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
