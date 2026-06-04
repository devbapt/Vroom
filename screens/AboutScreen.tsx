import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import IconVroom from '../assets/icon_vroom_Couleur.svg';
import TypoVroom from '../assets/typo_vroom_Blanc.svg';

const C = {
  bg:       '#140102',
  bgCard:   '#1F0808',
  accent:   '#E50914',
  white:    '#FFFFFF',
  whiteSoft:'rgba(255,255,255,0.7)',
  muted:    'rgba(255,255,255,0.45)',
  border:   'rgba(255,255,255,0.12)',
};

const APP_VERSION = '1.0.0';

function LinkRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#2A0A0A' }]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={C.whiteSoft} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={C.muted} />
    </Pressable>
  );
}

export default function AboutScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={C.white} />
        </Pressable>
        <Text style={styles.headerTitle}>À propos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Logo */}
        <View style={styles.logoBlock}>
          <IconVroom width={72} height={72} />
          <TypoVroom width={120} height={28} style={{ marginTop: 12 }} />
          <Text style={styles.version}>Version {APP_VERSION}</Text>
          <Text style={styles.tagline}>Le réseau social des passionnés d'automobile</Text>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardText}>
            Vroom est une communauté mobile dédiée aux amateurs de voitures. Partagez vos sorties,
            rencontrez d'autres pilotes, gérez votre garage virtuel et suivez les événements
            automobiles près de chez vous.
          </Text>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DOCUMENTS LÉGAUX</Text>
          <View style={styles.card}>
            <LinkRow icon="document-text-outline"  label="Mentions légales"            onPress={() => navigation.navigate('Legal')} />
            <View style={styles.sep} />
            <LinkRow icon="shield-checkmark-outline" label="Politique de confidentialité" onPress={() => navigation.navigate('Legal')} />
            <View style={styles.sep} />
            <LinkRow icon="reader-outline"          label="Conditions générales (CGU)"  onPress={() => navigation.navigate('Legal')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONTACT</Text>
          <View style={styles.card}>
            <LinkRow icon="mail-outline"     label="contact@vroom-app.fr"    onPress={() => Linking.openURL('mailto:contact@vroom-app.fr')} />
            <View style={styles.sep} />
            <LinkRow icon="lock-closed-outline" label="dpo@vroom-app.fr (DPO)" onPress={() => Linking.openURL('mailto:dpo@vroom-app.fr')} />
          </View>
        </View>

        <Text style={styles.footer}>© 2025 Vroom SAS · Tous droits réservés</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.white },

  content: { paddingHorizontal: 20, paddingBottom: 60 },

  logoBlock: { alignItems: 'center', paddingVertical: 36 },
  version:   { fontSize: 11, color: C.muted, marginTop: 8 },
  tagline:   { fontSize: 13, color: C.whiteSoft, marginTop: 6, textAlign: 'center' },

  card: {
    backgroundColor: C.bgCard, borderRadius: 12,
    borderWidth: 0.5, borderColor: C.border,
    overflow: 'hidden',
  },
  cardText: { fontSize: 13, color: C.whiteSoft, lineHeight: 20, padding: 16 },

  section:      { marginTop: 24 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 8 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLabel: { flex: 1, fontSize: 13, color: C.whiteSoft },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 16 },

  footer: { fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 36 },
});
