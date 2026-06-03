import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient'; 

import IconVroom from '../assets/icon_vroom_Couleur.svg';
import TypoVroom from '../assets/typo_vroom_Blanc.svg';
import GoogleLogo from '../assets/google_logo.svg';


const COLORS = {
  bg: '#140102',
  accent: '#E50914',
  text: '#FFFAFA',
  textMuted: 'rgb(255, 250, 250)', 
  border: 'rgba(255, 250, 250, 0.14)',
  fieldBg: 'rgba(255, 250, 250, 0.06)',
  fieldBgFocused: 'rgba(255, 250, 250, 0.10)',
  separator: 'rgba(255, 250, 250, 0.16)',
};

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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

  // --- MODIFICATION ICI : Suppression du pop-up de succès ---
  const handleLogin = async () => {
    if (!email || !password) {
      const msg = "Veuillez remplir tous les champs.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Erreur", msg);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      // On garde l'alerte d'erreur pour prévenir l'utilisateur s'il se trompe
      Platform.OS === 'web' ? alert(error.message) : Alert.alert("Erreur", error.message);
    } else {
      // Plus de popup ! AppNavigator va détecter la connexion tout seul
      console.log("Connexion réussie - Redirection en cours...");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.headerContainer}>
          <View style={styles.logoRow}>
            <IconVroom width={72} height={72} />
            <TypoVroom width={180} height={42} />
          </View>
        </View>

        <View style={styles.formContainer}>
          {/* Champ Email */}
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
              onChangeText={setEmail}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
            />
          </View>

          {/* Champ Mot de passe */}
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
              onChangeText={setPassword}
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
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={isPasswordFocused ? COLORS.accent : COLORS.textMuted}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            style={({ hovered }: any) => [hovered && { opacity: 0.7 }]}
          >
            <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
          </Pressable>

          {/* Bouton de Connexion */}
          <Pressable 
            onPress={handleLogin}
            disabled={loading}
            style={({ hovered, pressed }: any) => [
              styles.loginButton,
              hovered && styles.loginButtonHover,
              pressed && styles.loginButtonPressed,
              loading && { opacity: 0.6 }
            ]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.separatorContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>Ou continuer avec</Text>
          <View style={styles.line} />
        </View>

        {/* Boutons Sociaux */}

        <Pressable style={({ hovered }: any) => [styles.socialButton, styles.appleButton, hovered && { backgroundColor: '#222' }]}>
          <Ionicons name="logo-apple" size={20} color="#FFF" />
          <Text style={styles.appleButtonText}>Continuer avec Apple</Text>
        </Pressable>
        
        <Pressable style={({ hovered }: any) => [styles.socialButton, styles.googleButton, hovered && { opacity: 0.8 }]}>
          <GoogleLogo width={20} height={20} />
          <Text style={styles.googleButtonText}>Continuer avec Google</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Tu n'as pas de compte ? </Text>
          <Pressable
            onPress={() => navigation.navigate('Signup')}
            style={({ hovered }: any) => [hovered && { opacity: 0.7 }]}
          >
            <Text style={styles.signupText}>Inscrivez-vous</Text>
          </Pressable>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  keyboardView: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 25, paddingVertical: 40, justifyContent: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 50 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  formContainer: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fieldBg,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
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
  forgotPassword: { color: COLORS.accent, textAlign: 'right', fontSize: 13, fontWeight: '600', marginBottom: 30 },
  loginButton: {
    backgroundColor: COLORS.accent,
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && { transition: 'all 0.2s ease' }) as any,
  },
  loginButtonHover: { backgroundColor: 'rgba(229, 9, 20, 0.92)' },
  loginButtonPressed: { backgroundColor: 'rgba(229, 9, 20, 0.78)' },
  loginButtonText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.separator },
  orText: { color: COLORS.textMuted, marginHorizontal: 10, fontSize: 13 },
  socialButton: { flexDirection: 'row', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  googleButton: { backgroundColor: COLORS.text },
  googleButtonText: { color: '#000', fontSize: 15, fontWeight: '600', marginLeft: 10 },
  appleButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  appleButtonText: { color: COLORS.text, fontSize: 15, fontWeight: '600', marginLeft: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  footerText: { color: COLORS.textMuted, fontSize: 14 },
  signupText: { color: COLORS.accent, fontSize: 14, fontWeight: 'bold' },
});