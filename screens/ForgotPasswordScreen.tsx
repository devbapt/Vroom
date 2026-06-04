import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '../supabaseClient';

import IconVroom from '../assets/icon_vroom_Couleur.svg';
import TypoVroom from '../assets/typo_vroom_Blanc.svg';

const COLORS = {
  bg:             '#140102',
  accent:         '#E50914',
  text:           '#FFFAFA',
  textMuted:      'rgba(255, 250, 250, 0.5)',
  fieldBg:        'rgba(255, 250, 250, 0.06)',
  fieldBgFocused: 'rgba(255, 250, 250, 0.10)',
};

export default function ForgotPasswordScreen({ navigation }: { navigation: any }) {
  const [email, setEmail]     = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim();

    if (!trimmed) {
      Platform.OS === 'web'
        ? alert('Veuillez saisir votre adresse email.')
        : Alert.alert('Champ requis', 'Veuillez saisir votre adresse email.');
      return;
    }

    setLoading(true);
    console.log('Reset email sent to:', trimmed);

    const redirectTo = Platform.OS === 'web'
      ? window.location.origin
      : Linking.createURL('reset-password');

    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });
    setLoading(false);

    if (error) {
      Platform.OS === 'web'
        ? alert(error.message)
        : Alert.alert('Erreur', error.message);
    } else {
      setSent(true);
    }
  };

  // ── Confirmation state ───────────────────────────────────────────────────

  if (sent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.logoRow}>
            <IconVroom width={56} height={56} />
            <TypoVroom width={140} height={34} />
          </View>

          <View style={styles.sentIconWrap}>
            <Ionicons name="mail-open-outline" size={36} color={COLORS.accent} />
          </View>

          <Text style={styles.title}>Email envoyé !</Text>
          <Text style={styles.subtitle}>
            Un lien de réinitialisation a été envoyé à{'\n'}
            <Text style={{ color: COLORS.text, fontWeight: '700' }}>{email.trim()}</Text>
            {'\n\n'}Clique sur le lien pour définir ton nouveau mot de passe.
          </Text>

          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }: any) => [styles.submitBtn, pressed && { opacity: 0.82 }]}
          >
            <Text style={styles.submitText}>Retour à la connexion</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.container}>
          {/* Back */}
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={({ pressed }: any) => [styles.backBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </Pressable>

          {/* Logo */}
          <View style={styles.logoRow}>
            <IconVroom width={56} height={56} />
            <TypoVroom width={140} height={34} />
          </View>

          {/* Lock icon */}
          <View style={styles.lockIconWrap}>
            <Ionicons name="lock-closed" size={32} color={COLORS.accent} />
          </View>

          {/* Texts */}
          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.subtitle}>
            Pas de panique. Entrez l'adresse email associée à votre compte Vroom et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>

          {/* Email input */}
          <View style={[styles.inputWrapper, focused && styles.inputFocused]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={focused ? COLORS.accent : COLORS.textMuted}
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Email"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSend}
            disabled={loading}
            style={({ pressed }: any) => [styles.submitBtn, pressed && { opacity: 0.82 }, loading && { opacity: 0.6 }]}
          >
            {loading
              ? <ActivityIndicator color={COLORS.text} />
              : <Text style={styles.submitText}>Envoyer le lien</Text>
            }
          </Pressable>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Je m'en souviens ! </Text>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={({ pressed }: any) => pressed && { opacity: 0.6 }}>
              <Text style={styles.footerLink}>Retour à la connexion</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  kav:      { flex: 1 },

  container: { flex: 1, paddingHorizontal: 25, justifyContent: 'center' },

  backBtn: {
    position: 'absolute', top: 12, left: 0,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,250,250,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },

  logoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, marginBottom: 36,
  },

  lockIconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(229,9,20,0.12)',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 24,
  },

  sentIconWrap: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(229,9,20,0.12)',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 24,
  },

  title: {
    color: COLORS.text, fontSize: 22, fontWeight: '700',
    textAlign: 'center', marginBottom: 12,
  },
  subtitle: {
    color: COLORS.textMuted, fontSize: 13,
    textAlign: 'center', lineHeight: 20, marginBottom: 32,
  },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.fieldBg, borderRadius: 10,
    paddingHorizontal: 15, marginBottom: 20, height: 55,
    borderWidth: 1, borderColor: 'transparent',
  },
  inputFocused: { borderColor: COLORS.accent, backgroundColor: COLORS.fieldBgFocused },
  icon:  { marginRight: 10 },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },

  submitBtn: {
    backgroundColor: COLORS.accent, height: 55, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  submitText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },

  footer:      { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText:  { color: COLORS.textMuted, fontSize: 14 },
  footerLink:  { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
});
