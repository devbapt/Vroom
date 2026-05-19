import { useState, useEffect } from 'react';
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
  Alert,
  ScrollView,
} from 'react-native';
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
});
