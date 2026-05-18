import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';

import IconVroom from '../assets/icon_vroom_Couleur.svg';
import TypoVroom from '../assets/typo_vroom_Blanc.svg';

export default function WelcomeScreen() {
  const { user, dismissWelcome } = useAppContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      dismissWelcome();
    }, 2500);
    return () => clearTimeout(timer);
  }, [dismissWelcome]);

  const username = user?.username ?? '';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.logoRow}>
          <IconVroom width={80} height={80} />
          <TypoVroom width={200} height={46} />
        </View>

        <View style={styles.messageBlock}>
          <Text style={styles.welcome}>
            Bienvenue{username ? ` @${username}` : ''} !
          </Text>
          <Text style={styles.subtitle}>Ton garage est t'attend.</Text>
          <Text style={styles.hint}>L'aventure commence maintenant 🏎️</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#140102',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 48,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  messageBlock: {
    alignItems: 'center',
    gap: 10,
  },
  welcome: {
    color: '#FFFAFA',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#E50914',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    color: 'rgba(255, 250, 250, 0.55)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});
