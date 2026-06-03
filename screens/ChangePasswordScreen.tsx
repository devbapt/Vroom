import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

interface FieldState {
  next: boolean;
  confirm: boolean;
}

export default function ChangePasswordScreen({ navigation }: { navigation: any }) {
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow]       = useState<FieldState>({ next: false, confirm: false });
  const [focused, setFocused] = useState<FieldState>({ next: false, confirm: false });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleShow = (f: keyof FieldState) => setShow(p => ({ ...p, [f]: !p[f] }));
  const onFocus    = (f: keyof FieldState) => setFocused(p => ({ ...p, [f]: true }));
  const onBlur     = (f: keyof FieldState) => setFocused(p => ({ ...p, [f]: false }));

  const handleUpdate = async () => {
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Mot de passe mis à jour avec succès.');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <IconVroom width={56} height={56} />
            <TypoVroom width={140} height={34} />
          </View>

          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Nouveau mot de passe</Text>
            <Text style={styles.subtitle}>Choisissez un mot de passe sécurisé pour votre compte</Text>
          </View>

          {/* New password */}
          <View style={[styles.inputWrapper, focused.next && styles.inputFocused]}>
            <Ionicons
              name="lock-open-outline"
              size={20}
              color={focused.next ? COLORS.accent : COLORS.textMuted}
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!show.next}
              value={newPassword}
              onChangeText={setNewPassword}
              onFocus={() => onFocus('next')}
              onBlur={() => onBlur('next')}
            />
            <Pressable onPress={() => toggleShow('next')} hitSlop={8} style={styles.eyeBtn}>
              <Ionicons
                name={show.next ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={focused.next ? COLORS.accent : COLORS.textMuted}
              />
            </Pressable>
          </View>

          {/* Confirm password */}
          <View style={[styles.inputWrapper, focused.confirm && styles.inputFocused]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={focused.confirm ? COLORS.accent : COLORS.textMuted}
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!show.confirm}
              value={confirmPassword}
              onChangeText={t => { setConfirmPassword(t); if (error) setError(''); }}
              onFocus={() => onFocus('confirm')}
              onBlur={() => onBlur('confirm')}
            />
            <Pressable onPress={() => toggleShow('confirm')} hitSlop={8} style={styles.eyeBtn}>
              <Ionicons
                name={show.confirm ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={focused.confirm ? COLORS.accent : COLORS.textMuted}
              />
            </Pressable>
          </View>

          {error   ? <Text style={styles.errorText}>{error}</Text>   : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          {/* Submit */}
          <Pressable
            onPress={handleUpdate}
            disabled={loading}
            style={({ pressed }: any) => [styles.submitBtn, pressed && { opacity: 0.82 }, loading && { opacity: 0.6 }]}
          >
            {loading
              ? <ActivityIndicator color={COLORS.text} />
              : <Text style={styles.submitText}>Mettre à jour</Text>
            }
          </Pressable>

          {/* Cancel */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }: any) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  kav:      { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 25, justifyContent: 'center', paddingVertical: 40 },

  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 },

  titleBlock: { marginBottom: 32 },
  title:    { color: COLORS.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  subtitle: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.fieldBg, borderRadius: 10,
    paddingHorizontal: 15, marginBottom: 15, height: 55,
    borderWidth: 1, borderColor: 'transparent',
  },
  inputFocused: { borderColor: COLORS.accent, backgroundColor: COLORS.fieldBgFocused },
  icon:   { marginRight: 10 },
  input:  { flex: 1, color: COLORS.text, fontSize: 16 },
  eyeBtn: { padding: 8, borderRadius: 999 },

  errorText:   { color: COLORS.accent, fontSize: 13, marginBottom: 14, textAlign: 'center' },
  successText: { color: '#4CAF50',     fontSize: 13, marginBottom: 14, textAlign: 'center' },

  submitBtn: {
    backgroundColor: COLORS.accent, height: 55, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  submitText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },

  cancelBtn:  { marginTop: 20, alignItems: 'center' },
  cancelText: { color: COLORS.textMuted, fontSize: 14 },
});
