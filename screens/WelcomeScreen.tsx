import { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { useAppContext } from '../context/AppContext';
import IconVroom from '../assets/icon_vroom_Couleur.svg';
import TypoVroom from '../assets/typo_vroom_Blanc.svg';

const DURATION = 2800; // total before dismiss

export default function WelcomeScreen() {
  const { dismissWelcome } = useAppContext();

  // Animations
  const iconScale   = useRef(new Animated.Value(0.4)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const typoX       = useRef(new Animated.Value(-40)).current;
  const typoOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const glowScale   = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1 — Logo + glow entrance
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 55,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0.35,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(glowScale, {
        toValue: 1.4,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // 2 — Typo slides in after icon
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(typoX, {
          toValue: 0,
          tension: 70,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(typoOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, 280);

    // 3 — Fade out screen, then dismiss
    setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => dismissWelcome());
    }, DURATION - 420);
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      {/* Glow halo behind the icon */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Icon */}
      <Animated.View
        style={{
          opacity: iconOpacity,
          transform: [{ scale: iconScale }],
        }}
      >
        <IconVroom width={90} height={90} />
      </Animated.View>

      {/* Typo slides from the left */}
      <Animated.View
        style={{
          opacity: typoOpacity,
          transform: [{ translateX: typoX }],
          marginTop: 18,
        }}
      >
        <TypoVroom width={180} height={44} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#140102',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E50914',
  },
});
