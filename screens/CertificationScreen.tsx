import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:        '#140102',
  bgCard:    '#1F0808',
  accent:    '#E50914',
  white:     '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.7)',
  muted:     'rgba(255,255,255,0.45)',
  border:    'rgba(255,255,255,0.12)',
  success:   '#34C759',
  warning:   '#FF9F0A',
};

// ─── Étapes du flow ───────────────────────────────────────────────────────────

type Step = 'instructions' | 'camera' | 'preview' | 'uploading' | 'done';

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function CertificationScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { user }   = useAppContext();

  const vehiculeId: string   = route.params?.vehiculeId ?? '';
  const vehiculeName: string = route.params?.vehiculeName ?? 'votre véhicule';

  const [step,      setStep]      = useState<Step>('instructions');
  const [photoUri,  setPhotoUri]  = useState<string | null>(null);
  const [photoB64,  setPhotoB64]  = useState<string | null>(null);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  // ── Ouvre la caméra ────────────────────────────────────────────────────
  const handleOpenCamera = useCallback(async () => {
    setErrorMsg(null);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Vroom a besoin d\'accéder à ta caméra pour prendre la photo de preuve.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,   // Pas de recadrage — on veut la photo brute
      quality: 0.85,
      base64: true,
      exif: false,            // Pas de métadonnées GPS/date inutiles
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let b64 = asset.base64 ?? null;
      if (b64?.includes(';base64,')) b64 = b64.split(';base64,')[1] ?? b64;
      setPhotoUri(asset.uri);
      setPhotoB64(b64);
      setStep('preview');
    }
  }, []);

  // ── Upload + création de la demande ────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!photoB64 || !user?.id || !vehiculeId) return;
    setStep('uploading');
    setErrorMsg(null);

    try {
      // 1. Upload vers bucket preuves_propriete
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const binaryStr = atob(photoB64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

      const { error: uploadErr } = await supabase.storage
        .from('preuves_propriete')
        .upload(fileName, bytes, { contentType: 'image/jpeg', upsert: false });

      if (uploadErr) throw uploadErr;

      // 2. Récupérer l'URL signée (bucket privé → signed URL 10 ans)
      const { data: signedData, error: signedErr } = await supabase.storage
        .from('preuves_propriete')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10); // 10 ans

      if (signedErr || !signedData?.signedUrl) throw signedErr ?? new Error('URL manquante');

      // 3. Créer la demande en base
      const { error: insertErr } = await supabase
        .from('demandes_certification')
        .insert({
          vehicule_id: vehiculeId,
          user_id:     user.id,
          preuve_url:  signedData.signedUrl,
          statut:      'en_attente',
        });

      if (insertErr) throw insertErr;

      setStep('done');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Une erreur est survenue. Réessayez.');
      setStep('preview');
    }
  }, [photoB64, user?.id, vehiculeId]);

  // ── Retake ─────────────────────────────────────────────────────────────
  const handleRetake = useCallback(() => {
    setPhotoUri(null);
    setPhotoB64(null);
    setStep('camera');
    handleOpenCamera();
  }, [handleOpenCamera]);

  // ══════════════════════════════════════════════════════════════════════
  // RENDERS
  // ══════════════════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          disabled={step === 'uploading'}
        >
          <Ionicons name="chevron-back" size={24} color={step === 'uploading' ? C.muted : C.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Certification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── INSTRUCTIONS ─────────────────────────────────────────── */}
        {step === 'instructions' && (
          <>
            <View style={styles.heroSection}>
              <View style={styles.shieldIcon}>
                <Ionicons name="shield-checkmark" size={48} color={C.success} />
              </View>
              <Text style={styles.heroTitle}>Obtiens ton badge ✅</Text>
              <Text style={styles.heroSub}>
                Prouve que {vehiculeName} t'appartient en réalisant le défi photo.
                Ton badge sera visible sur ton profil et tes publications.
              </Text>
            </View>

            {/* Instructions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Comment ça marche ?</Text>
              {[
                { icon: '📝', text: 'Prépare un papier avec ton pseudo Vroom et la date du jour.' },
                { icon: '📸', text: 'Prends une photo de ton tableau de bord avec le papier bien visible.' },
                { icon: '🔍', text: 'Notre équipe vérifie la demande sous 48h.' },
                { icon: '✅', text: 'Tu reçois ton badge de propriété vérifié.' },
              ].map((step, i) => (
                <View key={i} style={styles.instructionRow}>
                  <Text style={styles.instructionEmoji}>{step.icon}</Text>
                  <Text style={styles.instructionText}>{step.text}</Text>
                </View>
              ))}
            </View>

            {/* Exemple */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Le papier doit indiquer :</Text>
              <View style={styles.challengeBox}>
                <Text style={styles.challengeText}>{"Vroom\n@" + (user?.username ?? 'ton_pseudo') + "\n" + new Date().toLocaleDateString('fr-FR')}</Text>
              </View>
              <Text style={styles.cardHint}>
                Écris-le à la main — les screenshots ou les impressions ne sont pas acceptés.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={() => { setStep('camera'); handleOpenCamera(); }}
            >
              <Ionicons name="camera" size={20} color={C.white} />
              <Text style={styles.primaryBtnText}>Ouvrir la caméra</Text>
            </Pressable>
          </>
        )}

        {/* ── PREVIEW ──────────────────────────────────────────────── */}
        {step === 'preview' && photoUri && (
          <>
            <Text style={styles.previewTitle}>Ta photo de preuve</Text>

            <ExpoImage
              source={photoUri}
              style={styles.previewImage}
              contentFit="cover"
            />

            {errorMsg && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={18} color={C.accent} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.previewHint}>
              <Ionicons name="information-circle-outline" size={16} color={C.muted} />
              <Text style={styles.previewHintText}>
                Vérifie que le papier avec ton pseudo est bien lisible avant d'envoyer.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSubmit}
            >
              <Ionicons name="send-outline" size={18} color={C.white} />
              <Text style={styles.primaryBtnText}>Envoyer la demande</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              onPress={handleRetake}
            >
              <Ionicons name="camera-outline" size={16} color={C.muted} />
              <Text style={styles.secondaryBtnText}>Reprendre la photo</Text>
            </Pressable>
          </>
        )}

        {/* ── UPLOADING ────────────────────────────────────────────── */}
        {step === 'uploading' && (
          <View style={styles.uploadingSection}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={styles.uploadingText}>Envoi de ta preuve en cours...</Text>
            <Text style={styles.uploadingHint}>Ne ferme pas l'application</Text>
          </View>
        )}

        {/* ── DONE ─────────────────────────────────────────────────── */}
        {step === 'done' && (
          <>
            <View style={styles.doneSection}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={C.success} />
              </View>
              <Text style={styles.doneTitle}>Demande envoyée !</Text>
              <Text style={styles.doneSub}>
                Notre équipe vérifie ta preuve sous 48h. Tu verras le badge{' '}
                <Text style={{ color: C.success, fontWeight: '700' }}>✅</Text>{' '}
                apparaître sur ton profil dès validation.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.pendingRow}>
                <Ionicons name="time-outline" size={18} color={C.warning} />
                <Text style={styles.pendingText}>
                  Statut : <Text style={{ color: C.warning, fontWeight: '700' }}>En attente de vérification</Text>
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.primaryBtnText}>Retour au garage</Text>
            </Pressable>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.white },
  content: { paddingHorizontal: 20, paddingTop: 24 },

  // Hero
  heroSection: { alignItems: 'center', marginBottom: 28, gap: 12 },
  shieldIcon:  {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(52,199,89,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: C.white, textAlign: 'center' },
  heroSub:   { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },

  // Card
  card:      {
    backgroundColor: C.bgCard, borderRadius: 14,
    borderWidth: 0.5, borderColor: C.border,
    padding: 16, marginBottom: 16,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.white, marginBottom: 12 },
  cardHint:  { fontSize: 11, color: C.muted, marginTop: 10, lineHeight: 16 },

  // Instructions
  instructionRow:  { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  instructionEmoji:{ fontSize: 18, width: 26 },
  instructionText: { flex: 1, fontSize: 13, color: C.whiteSoft, lineHeight: 19 },

  // Challenge box
  challengeBox: {
    backgroundColor: '#FFF8E7', borderRadius: 8,
    padding: 14, borderWidth: 1, borderColor: '#FFD60A',
    alignItems: 'center',
  },
  challengeText: {
    fontSize: 16, fontWeight: '700', color: '#1A1A1A',
    textAlign: 'center', lineHeight: 26,
    fontFamily: 'Courier New',
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.accent, borderRadius: 12, height: 52, marginBottom: 12,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: C.white },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12,
  },
  secondaryBtnText: { fontSize: 13, color: C.muted, fontWeight: '500' },

  // Preview
  previewTitle:  { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 14, textAlign: 'center' },
  previewImage:  { width: '100%', aspectRatio: 4/3, borderRadius: 12, marginBottom: 16, backgroundColor: '#000' },
  previewHint:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 16 },
  previewHintText:{ flex: 1, fontSize: 12, color: C.muted, lineHeight: 17 },

  // Error
  errorCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: 'rgba(229,9,20,0.1)',
    borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(229,9,20,0.3)',
    padding: 12, marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: 12, color: C.whiteSoft },

  // Uploading
  uploadingSection: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 16 },
  uploadingText:    { fontSize: 16, fontWeight: '700', color: C.white },
  uploadingHint:    { fontSize: 12, color: C.muted },

  // Done
  doneSection: { alignItems: 'center', paddingVertical: 24, gap: 14, marginBottom: 12 },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(52,199,89,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  doneTitle:   { fontSize: 22, fontWeight: '800', color: C.white, textAlign: 'center' },
  doneSub:     { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },

  // Pending
  pendingRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingText: { fontSize: 13, color: C.whiteSoft },
});
