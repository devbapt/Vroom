import { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';

import IconVroom from '../assets/icon_vroom_Couleur.svg';
import TypoVroom from '../assets/typo_vroom_Blanc.svg';

const COLORS = {
  bg: '#140102',
  accent: '#E50914',
  text: '#FFFAFA',
  textMuted: 'rgb(255, 250, 250)',
  border: 'rgba(255, 250, 250, 0.14)',
  fieldBg: 'rgba(255, 250, 250, 0.06)',
  fieldBgFocused: 'rgba(255, 250, 250, 0.10)',
  separator: 'rgba(255, 250, 250, 0.16)',
  error: '#FF6B6B',
};

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;

function validateUsername(v: string): string | null {
  if (!v.trim()) return 'Le pseudo est requis.';
  if (!USERNAME_REGEX.test(v.trim())) return 'Pseudo : 3–20 caractères, lettres, chiffres ou _.';
  return null;
}
function validateEmail(v: string): string | null {
  if (!v.trim()) return "L'email est requis.";
  if (!EMAIL_REGEX.test(v.trim())) return 'Adresse email invalide.';
  return null;
}
function validatePassword(v: string): string | null {
  if (!v) return 'Le mot de passe est requis.';
  if (!PASSWORD_REGEX.test(v)) return 'Min. 8 caractères, au moins une lettre et un chiffre.';
  return null;
}
function validateConfirmPassword(pw: string, confirm: string): string | null {
  if (!confirm) return 'Veuillez confirmer votre mot de passe.';
  if (pw !== confirm) return 'Les mots de passe ne correspondent pas.';
  return null;
}

export default function SignupScreen({ navigation }: { navigation: any }) {
  const { triggerWelcome, refreshProfile } = useAppContext();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.innerHTML = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #140102 inset !important;
        -webkit-text-fill-color: #FFFAFA !important;
        caret-color: #FFFAFA;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [rgpdExpanded, setRgpdExpanded] = useState(false);

  const showAlert = (message: string) => {
    Platform.OS === 'web' ? alert(message) : Alert.alert('Erreur', message);
  };

  const handleSignup = async () => {
    const uErr = validateUsername(username);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validateConfirmPassword(password, confirmPassword);

    setUsernameError(uErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmError(cErr);

    if (uErr || eErr || pErr || cErr) return;
    if (!consentAccepted) {
      showAlert('Veuillez accepter les CGU et la politique de confidentialité pour continuer.');
      return;
    }

    setLoading(true);
    try {
      // Vérifier unicité du pseudo
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim().toLowerCase())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        showAlert('Erreur lors de la vérification du pseudo. Réessayez.');
        return;
      }
      if (existingProfile) {
        setUsernameError('Ce pseudo est déjà utilisé. Veuillez en choisir un autre.');
        return;
      }

      // Créer le compte auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('email already')) {
          setEmailError('Cette adresse email est déjà utilisée.');
        } else {
          showAlert(signUpError.message);
        }
        return;
      }

      if (!data.user) {
        showAlert('Erreur inattendue. Veuillez réessayer.');
        return;
      }

      // Insérer le profil en base (avant de déclencher le welcome)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, username: username.trim().toLowerCase() }]);

      if (profileError) {
        if (profileError.code === '23505') {
          setUsernameError('Ce pseudo vient d\'être pris. Veuillez en choisir un autre.');
          return;
        }
        console.error('Profile insert error:', profileError.message);
      }

      // Forcer la re-lecture du profil maintenant qu'il est inséré
      await refreshProfile(data.user.id);

      // Déclencher l'écran de bienvenue — profil déjà dans le contexte
      triggerWelcome();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.flex, { backgroundColor: COLORS.bg }]}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          style={{ backgroundColor: COLORS.bg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoRow}>
              <IconVroom width={72} height={72} />
              <TypoVroom width={180} height={42} />
            </View>
            <Text style={styles.subtitle}>Créer votre compte</Text>
            <Text style={styles.subtitleMuted}>Rejoignez la communauté Vroom</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Pseudo */}
            <View style={[styles.inputWrapper, isUsernameFocused && styles.inputFocused]}>
              <Ionicons
                name="person-outline"
                size={20}
                color={isUsernameFocused ? COLORS.accent : COLORS.textMuted}
                style={styles.icon}
              />
              <TextInput
                style={[styles.input, { color: COLORS.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Pseudo"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={(t) => { setUsername(t); setUsernameError(null); }}
                onFocus={() => setIsUsernameFocused(true)}
                onBlur={() => setIsUsernameFocused(false)}
              />
            </View>
            {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}

            {/* Email */}
            <View style={[styles.inputWrapper, isEmailFocused && styles.inputFocused]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={isEmailFocused ? COLORS.accent : COLORS.textMuted}
                style={styles.icon}
              />
              <TextInput
                style={[styles.input, { color: COLORS.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Email"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(null); }}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}

            {/* Mot de passe */}
            <View style={[styles.inputWrapper, isPasswordFocused && styles.inputFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isPasswordFocused ? COLORS.accent : COLORS.textMuted}
                style={styles.icon}
              />
              <TextInput
                style={[styles.input, { color: COLORS.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Mot de passe"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => { setPassword(t); setPasswordError(null); }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={({ pressed, hovered }: any) => [
                  styles.eyeButton,
                  (hovered || pressed) && styles.eyeButtonActive,
                ]}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={isPasswordFocused ? COLORS.accent : COLORS.textMuted}
                />
              </Pressable>
            </View>
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

            {/* Confirmer mot de passe */}
            <View style={[styles.inputWrapper, isConfirmFocused && styles.inputFocused]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={isConfirmFocused ? COLORS.accent : COLORS.textMuted}
                style={styles.icon}
              />
              <TextInput
                style={[styles.input, { color: COLORS.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setConfirmError(null); }}
                onFocus={() => setIsConfirmFocused(true)}
                onBlur={() => setIsConfirmFocused(false)}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={({ pressed, hovered }: any) => [
                  styles.eyeButton,
                  (hovered || pressed) && styles.eyeButtonActive,
                ]}
                hitSlop={8}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={isConfirmFocused ? COLORS.accent : COLORS.textMuted}
                />
              </Pressable>
            </View>
            {confirmError && <Text style={styles.errorText}>{confirmError}</Text>}

            {/* ── Bloc RGPD (recommandé CNIL : information à plusieurs niveaux) ── */}
            <View style={styles.rgpdBox}>
              <View style={styles.rgpdHeader}>
                <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.accent} />
                <Text style={styles.rgpdTitle}>Vos données personnelles</Text>
                <Pressable onPress={() => setRgpdExpanded(v => !v)} hitSlop={8}>
                  <Ionicons name={rgpdExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.textMuted} />
                </Pressable>
              </View>
              <Text style={styles.rgpdSummary}>
                Vroom SAS collecte votre email, pseudo et photo de profil pour créer votre compte.
                Données conservées jusqu'à suppression du compte.
              </Text>
              {rgpdExpanded && (
                <View style={styles.rgpdDetails}>
                  <Text style={styles.rgpdRow}>
                    <Text style={styles.rgpdBold}>Responsable :</Text> Vroom SAS
                  </Text>
                  <Text style={styles.rgpdRow}>
                    <Text style={styles.rgpdBold}>Finalités :</Text> Profil, feed, messagerie, carte
                  </Text>
                  <Text style={styles.rgpdRow}>
                    <Text style={styles.rgpdBold}>Conservation :</Text> Compte + 30j · Messages 2 ans · Logs 12 mois
                  </Text>
                  <Text style={styles.rgpdRow}>
                    <Text style={styles.rgpdBold}>Vos droits :</Text> Accès, rectification, suppression, portabilité
                  </Text>
                  <Text style={styles.rgpdRow}>
                    <Text style={styles.rgpdBold}>Contact DPO :</Text> dpo@vroom-app.fr
                  </Text>
                  <Text style={styles.rgpdRow}>
                    <Text style={styles.rgpdBold}>Réclamation :</Text> www.cnil.fr
                  </Text>
                </View>
              )}
            </View>

            {/* ── Checkbox de consentement ── */}
            <Pressable style={styles.consentRow} onPress={() => setConsentAccepted(v => !v)}>
              <View style={[styles.checkbox, consentAccepted && styles.checkboxChecked]}>
                {consentAccepted && <Ionicons name="checkmark" size={13} color="#FFF" />}
              </View>
              <Text style={styles.consentText}>
                J'accepte les{' '}
                <Text style={styles.consentLink}>CGU</Text>
                {' '}et la{' '}
                <Text style={styles.consentLink}>politique de confidentialité</Text>
              </Text>
            </Pressable>

            {/* Bouton S'inscrire */}
            <Pressable
              onPress={handleSignup}
              disabled={loading}
              style={({ hovered, pressed }: any) => [
                styles.signupButton,
                hovered && styles.signupButtonHover,
                pressed && styles.signupButtonPressed,
                loading && { opacity: 0.6 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.signupButtonText}>S'inscrire</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ hovered }: any) => [hovered && { opacity: 0.7 }]}
            >
              <Text style={styles.loginText}>Se connecter</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  container: { paddingHorizontal: 25, paddingVertical: 40, justifyContent: 'center', flexGrow: 1 },
  headerContainer: { alignItems: 'center', marginBottom: 36 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  subtitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subtitleMuted: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', opacity: 0.7 },
  formContainer: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fieldBg,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 8,
    height: 55,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.fieldBgFocused,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },
  eyeButton: { padding: 8, borderRadius: 999 },
  eyeButtonActive: { backgroundColor: 'rgba(255, 250, 250, 0.08)' },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  signupButton: {
    backgroundColor: COLORS.accent,
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...(Platform.OS === 'web' && { transition: 'all 0.2s ease' }) as any,
  },
  signupButtonHover: { backgroundColor: 'rgba(229, 9, 20, 0.92)' },
  signupButtonPressed: { backgroundColor: 'rgba(229, 9, 20, 0.78)' },
  signupButtonText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: COLORS.textMuted, fontSize: 14 },
  loginText: { color: COLORS.accent, fontSize: 14, fontWeight: 'bold' },

  // RGPD
  rgpdBox: {
    marginTop: 16, marginBottom: 4,
    backgroundColor: 'rgba(229,9,20,0.07)',
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.25)',
    padding: 12,
  },
  rgpdHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  rgpdTitle:  { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.accent },
  rgpdSummary:{ fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
  rgpdDetails:{ marginTop: 10, gap: 5 },
  rgpdRow:    { fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
  rgpdBold:   { fontWeight: '700', color: COLORS.text },

  // Checkbox consentement
  consentRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12, marginBottom: 4 },
  checkbox:       {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked:{ backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  consentText:    { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  consentLink:    { color: COLORS.accent, fontWeight: '600' },
});
