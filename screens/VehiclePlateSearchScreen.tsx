import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Animated, Easing, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:         '#140102',
  bgCard:     '#1F0808',
  accent:     '#E50914',
  white:      '#FFFFFF',
  whiteSoft:  'rgba(255,255,255,0.7)',
  whiteGhost: 'rgba(255,255,255,0.2)',
  border:     'rgba(255,255,255,0.12)',
  muted:      'rgba(255,255,255,0.45)',
  success:    '#34C759',
};

// ─── Résultat retourné par la Edge Function ───────────────────────────────────

type VehicleResult = {
  plaque_normalized: string;
  marque: string;
  modele: string;
  annee: number;
};

// ─── Composant plaque stylisée ────────────────────────────────────────────────

function PlateDisplay({ plate }: { plate: string }) {
  // Formate AA123BB → AA-123-BB pour l'affichage
  const formatted = plate.length === 7
    ? `${plate.slice(0, 2)}-${plate.slice(2, 5)}-${plate.slice(5)}`
    : plate;

  return (
    <View style={styles.plateFrame}>
      <View style={styles.plateBlueBand}>
        <Text style={styles.plateBlueBandText}>F</Text>
      </View>
      <Text style={styles.plateText}>{formatted}</Text>
    </View>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonRow() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useState(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, easing: Easing.ease, useNativeDriver: true }),
      ])
    ).start();
  });

  return (
    <Animated.View style={[styles.skeletonRow, { opacity }]}>
      <View style={styles.skeletonLabel} />
      <View style={styles.skeletonValue} />
    </Animated.View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function VehiclePlateSearchScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [plate,    setPlate]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [result,   setResult]   = useState<VehicleResult | null>(null);

  const inputRef = useRef<TextInput>(null);

  // ── Formate automatiquement la plaque SIV : "AB123CD" → "AB-123-CD" ──────
  const formatPlate = (raw: string): string => {
    // 1. Garder seulement les alphanumérique, mettre en majuscule, max 7 chars
    const clean = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 7);
    // 2. Insérer les tirets aux bonnes positions
    if (clean.length <= 2) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
    return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
  };

  const handleChange = useCallback((text: string) => {
    const formatted = formatPlate(text);
    setPlate(formatted);
    setError(null);
    setResult(null);
  }, []);

  // ── Appel à la Edge Function ─────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!plate.trim()) return;
    inputRef.current?.blur();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('fetch-vehicle-info', {
        body: { plaque: plate },
      });

      if (fnErr) {
        // En Supabase JS v2, les erreurs HTTP sont dans fnErr.context (FunctionsHttpError)
        // On tente d'extraire le JSON du corps de la réponse
        try {
          const errBody = await (fnErr as any).context?.json?.();
          setError(errBody?.error ?? fnErr.message ?? 'Erreur inconnue');
        } catch {
          setError(fnErr.message ?? 'Erreur inconnue');
        }
        return;
      }

      setResult(data as VehicleResult);
    } catch (e: any) {
      setError('Impossible de contacter le service. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [plate]);

  // ── Confirmer → naviguer vers AddVehicle avec données pré-remplies ───────
  const handleConfirm = useCallback(() => {
    if (!result) return;
    navigation.navigate('AddVehicle', {
      prefill: {
        brand:          result.marque,
        model:          result.modele,
        year:           String(result.annee),
        plateNormalized: result.plaque_normalized,
      },
    });
  }, [result, navigation]);

  // ── Saisie manuelle ───────────────────────────────────────────────────────
  const handleManual = useCallback(() => {
    navigation.navigate('AddVehicle', {});
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={C.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Ajouter un véhicule</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >

          {/* Hero text */}
          <View style={styles.hero}>
            <Ionicons name="car-sport-outline" size={40} color={C.accent} />
            <Text style={styles.heroTitle}>Trouvez votre véhicule</Text>
            <Text style={styles.heroSub}>
              Saisissez votre plaque d'immatriculation pour pré-remplir automatiquement
              les informations du véhicule.
            </Text>
          </View>

          {/* Champ plaque */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>PLAQUE D'IMMATRICULATION</Text>
            <View style={[styles.inputWrapper, plate.length > 0 && styles.inputWrapperActive]}>
              <Ionicons name="card-outline" size={18} color={plate ? C.accent : C.muted} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={plate}
                onChangeText={handleChange}
                placeholder="AB-123-CD"
                placeholderTextColor={C.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={9}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {plate.length > 0 && (
                <Pressable onPress={() => { setPlate(''); setResult(null); setError(null); }} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={C.muted} />
                </Pressable>
              )}
            </View>

            {/* Bouton recherche */}
            <Pressable
              style={({ pressed }) => [
                styles.searchBtn,
                (!plate.trim() || loading) && styles.searchBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleSearch}
              disabled={!plate.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <>
                  <Ionicons name="search" size={16} color={C.white} />
                  <Text style={styles.searchBtnText}>Rechercher mon véhicule</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* État : chargement skeleton */}
          {loading && (
            <View style={styles.resultCard}>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </View>
          )}

          {/* État : erreur */}
          {error && !loading && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color={C.accent} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* État : succès — confirmation */}
          {result && !loading && (
            <View style={styles.resultCard}>
              <Text style={styles.resultQuestion}>Est-ce bien ce véhicule ?</Text>

              <PlateDisplay plate={result.plaque_normalized} />

              <View style={styles.resultRows}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Marque</Text>
                  <Text style={styles.resultValue}>{result.marque}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Modèle</Text>
                  <Text style={styles.resultValue}>{result.modele}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Année</Text>
                  <Text style={styles.resultValue}>{result.annee || '—'}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.85 }]}
                onPress={handleConfirm}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
                <Text style={styles.confirmBtnText}>Oui, c'est mon véhicule</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.wrongBtn, pressed && { opacity: 0.7 }]}
                onPress={() => { setResult(null); setPlate(''); inputRef.current?.focus(); }}
              >
                <Text style={styles.wrongBtnText}>Non, recommencer</Text>
              </Pressable>
            </View>
          )}

          {/* Saisie manuelle (toujours visible) */}
          {!result && !loading && (
            <Pressable
              style={({ pressed }) => [styles.manualBtn, pressed && { opacity: 0.7 }]}
              onPress={handleManual}
            >
              <Ionicons name="create-outline" size={16} color={C.muted} />
              <Text style={styles.manualBtnText}>Saisir manuellement</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.white },

  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32, flexGrow: 1 },

  // Hero
  hero:      { alignItems: 'center', marginBottom: 32, gap: 10 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: C.white, textAlign: 'center' },
  heroSub:   { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },

  // Input
  inputSection:     { marginBottom: 20 },
  inputLabel:       { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, marginBottom: 8 },
  inputWrapper:     {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 52, marginBottom: 12,
  },
  inputWrapperActive: { borderColor: C.accent },
  input:    { flex: 1, fontSize: 18, fontWeight: '700', color: C.white, letterSpacing: 2 },

  // Search button
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.accent, borderRadius: 12, height: 50,
  },
  searchBtnDisabled: { opacity: 0.4 },
  searchBtnText:     { fontSize: 15, fontWeight: '700', color: C.white },

  // Result card
  resultCard: {
    backgroundColor: C.bgCard, borderRadius: 16,
    borderWidth: 0.5, borderColor: C.border,
    padding: 18, gap: 12,
  },
  resultQuestion: { fontSize: 16, fontWeight: '700', color: C.white, textAlign: 'center' },

  // Plate display
  plateFrame: {
    flexDirection: 'row', alignSelf: 'center',
    borderRadius: 6, borderWidth: 2, borderColor: '#CCC',
    overflow: 'hidden', height: 44,
  },
  plateBlueBand: {
    width: 28, backgroundColor: '#003399',
    justifyContent: 'center', alignItems: 'center',
  },
  plateBlueBandText: { color: C.white, fontSize: 11, fontWeight: '800' },
  plateText: {
    paddingHorizontal: 16,
    fontSize: 20, fontWeight: '900',
    color: '#1A1A1A', backgroundColor: '#FFF',
    textAlignVertical: 'center', lineHeight: 40,
    letterSpacing: 2,
  },

  // Result rows
  resultRows: { gap: 8 },
  resultRow:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  resultLabel: { fontSize: 12, color: C.muted, fontWeight: '500' },
  resultValue: { fontSize: 14, fontWeight: '700', color: C.white },

  // Confirm
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.success, borderRadius: 10, height: 48, marginTop: 4,
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: C.white },

  wrongBtn:     { alignItems: 'center', paddingVertical: 10 },
  wrongBtnText: { fontSize: 13, color: C.muted },

  // Error
  errorCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(229,9,20,0.10)',
    borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(229,9,20,0.3)',
    padding: 14,
  },
  errorText: { flex: 1, fontSize: 13, color: C.whiteSoft, lineHeight: 18 },

  // Skeleton
  skeletonRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  skeletonLabel: { width: 70,  height: 12, borderRadius: 6, backgroundColor: C.whiteGhost },
  skeletonValue: { width: 120, height: 12, borderRadius: 6, backgroundColor: C.whiteGhost },

  // Manual
  manualBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, marginTop: 8,
  },
  manualBtnText: { fontSize: 13, color: C.muted, fontWeight: '500' },
});
