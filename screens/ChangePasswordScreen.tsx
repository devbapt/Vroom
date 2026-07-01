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
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
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

type FieldKey = 'current' | 'next' | 'confirm';

export default function ChangePasswordScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const isRecoveryMode: boolean = route.params?.isRecoveryMode === true;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow]       = useState<Record<FieldKey, boolean>>({ current: false, next: false, confirm: false });
  const [focused, setFocused] = useState<Record<FieldKey, boolean>>({ current: false, next: false, confirm: false });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleShow = (f: FieldKey) => setShow(p => ({ ...p, [f]: !p[f] }));
  const onFocus    = (f: FieldKey) => setFocused(p => ({ ...p, [f]: true }));
  const onBlur     = (f: FieldKey) => setFocused(p => ({ ...p, [f]: false }));

  const handleUpdate = async () => {
    setError('');
    setSuccess('');

    if (!isRecoveryMode && !currentPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (!isRecoveryMode && currentPassword === newPassword) {
      setError('Le nouveau mot de passe doit être différent de l\'actuel.');
      return;
    }

    setLoading(true);

    // Hors recovery : vérifier le mot de passe actuel avant de le changer.
    // En recovery (lien email cliqué), la session est déjà authentifiée par
    // Supabase — l'utilisateur ne connaît justement plus son mot de passe.
    if (!isRecoveryMode) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setError('Impossible de vérifier votre identité. Reconnectez-vous.');
        setLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        setError('Mot de passe actuel incorrect.');
        setLoading(false);
        return;
      }
    }

    // Mettre à jour avec le nouveau mot de passe
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    if (isRecoveryMode) {
      // Le nouveau mot de passe est actif. On déconnecte pour repartir sur un
      // écran de connexion propre — évite de rester coincé sur cet écran de
      // recovery (isRecovery ne repasse à false que sur SIGNED_OUT/SIGNED_IN).
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess('Mot de passe mis à jour avec succès.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
        keyboardVerticalOffset={insets.top}
      >
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
            <Text style={styles.title}>
              {isRecoveryMode ? 'Choisir un nouveau mot de passe' : 'Changer de mot de passe'}
            </Text>
            <Text style={styles.subtitle}>
              {isRecoveryMode
                ? 'Ton lien de récupération est validé — choisis un nouveau mot de passe.'
                : "Confirmez d'abord votre mot de passe actuel"}
            </Text>
          </View>

          {/* Current password — masqué en mode recovery : c'est justement ce que l'utilisateur a oublié */}
          {!isRecoveryMode && (
            <>
              <View style={[styles.inputWrapper, focused.current && styles.inputFocused]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focused.current ? COLORS.accent : COLORS.textMuted}
                  style={styles.icon}
                />
                <TextInput
                  style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholder="Mot de passe actuel"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!show.current}
                  value={currentPassword}
                  onChangeText={t => { setCurrentPassword(t); if (error) setError(''); }}
                  onFocus={() => onFocus('current')}
                  onBlur={() => onBlur('current')}
                />
                <Pressable onPress={() => toggleShow('current')} hitSlop={8} style={styles.eyeBtn}>
                  <Ionicons
                    name={show.current ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={focused.current ? COLORS.accent : COLORS.textMuted}
                  />
                </Pressable>
              </View>

              <View style={styles.divider} />
            </>
          )}

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
              placeholder="Confirmer le nouveau mot de passe"
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

          {/* Cancel — masqué en recovery : aucun écran précédent vers lequel revenir */}
          {!isRecoveryMode && (
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }: any) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  kav:      { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 25, justifyContent: 'center', paddingVertical: 40 },

  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 },

  titleBlock: { marginBottom: 28 },
  title:    { color: COLORS.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  subtitle: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },

  divider: { height: 1, backgroundColor: 'rgba(255,250,250,0.08)', marginBottom: 14, marginTop: 2 },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.fieldBg, borderRadius: 10,
    paddingHorizontal: 15, marginBottom: 12, height: 55,
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
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  submitText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },

  cancelBtn:  { marginTop: 20, alignItems: 'center' },
  cancelText: { color: COLORS.textMuted, fontSize: 14 },
});
