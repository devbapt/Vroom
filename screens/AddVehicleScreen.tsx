import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context';
import { getTranslation } from '../i18n';
import { supabase } from '../supabaseClient';
import type {
  VehicleTransmission,
  VehicleDrivetrain,
  VehicleFuel,
  VehicleStatus,
} from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  bg: '#140102',
  surface: '#1F0808',
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.6)',
  whiteFaint: 'rgba(255,255,255,0.2)',
  placeholder: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.15)',
  borderActive: 'rgba(229,9,20,0.6)',
};

const MONO = 'Courier';

const BRANDS = [
  'Alfa Romeo', 'Aston Martin', 'Audi', 'BMW', 'Bugatti', 'Chevrolet',
  'Ferrari', 'Ford', 'Honda', 'Koenigsegg', 'Lamborghini', 'Maserati',
  'McLaren', 'Mercedes-Benz', 'Nissan', 'Pagani', 'Porsche', 'Renault',
  'Toyota', 'Volkswagen',
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ChipOption<T extends string> = { value: T; label: string };

const TRANSMISSION_OPTIONS: ChipOption<VehicleTransmission>[] = [
  { value: 'MT',  label: 'MT' },
  { value: 'AT',  label: 'AT' },
  { value: 'DCT', label: 'DCT' },
  { value: 'PDK', label: 'PDK' },
  { value: 'CVT', label: 'CVT' },
];

const DRIVETRAIN_OPTIONS: ChipOption<VehicleDrivetrain>[] = [
  { value: 'RWD', label: 'RWD' },
  { value: 'FWD', label: 'FWD' },
  { value: 'AWD', label: 'AWD' },
  { value: '4WD', label: '4WD' },
];

// Fuel labels are built dynamically from translations (see component)

const STATUS_OPTIONS: ChipOption<VehicleStatus>[] = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'track',   label: 'Track' },
  { value: 'show',    label: 'Show' },
  { value: 'project', label: 'Project' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.accentBar} />
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  mono = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
  mono?: boolean;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          multiline && styles.fieldInputMultiline,
          mono && { fontFamily: MONO, fontSize: 15 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 5 : 1}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        selectionColor={C.accent}
      />
    </View>
  );
}

function ChipSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BrandInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (v: string) => void;
}) {
  const suggestions = value.length >= 2
    ? BRANDS.filter(b => b.toLowerCase().startsWith(value.toLowerCase())).slice(0, 4)
    : [];

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>MARQUE *</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="Ferrari, Porsche…"
        placeholderTextColor={C.placeholder}
        selectionColor={C.accent}
      />
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map(s => (
            <Pressable key={s} style={styles.suggestionItem} onPress={() => onChangeText(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddVehicleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, language } = useAppContext();
  const t = getTranslation(language).garage;

  const FUEL_OPTIONS: ChipOption<VehicleFuel>[] = [
    { value: 'gasoline', label: t.fuel_gasoline },
    { value: 'diesel',   label: t.fuel_diesel },
    { value: 'hybrid',   label: t.fuel_hybrid },
    { value: 'electric', label: t.fuel_electric },
  ];

  // Identity
  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [nickname, setNickname] = useState('');

  // Technical
  const [power, setPower] = useState('');
  const [acceleration, setAcceleration] = useState('');
  const [transmission, setTransmission] = useState<VehicleTransmission | undefined>();
  const [drivetrain, setDrivetrain] = useState<VehicleDrivetrain | undefined>();
  const [fuel, setFuel] = useState<VehicleFuel | undefined>();

  // Details
  const [color, setColor] = useState('');
  const [mileage, setMileage] = useState('');
  const [acquiredAt, setAcquiredAt] = useState('');
  const [status, setStatus] = useState<VehicleStatus | undefined>();

  // Notes
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = imageUri.trim() !== '' && brand.trim() !== '' && model.trim() !== '' && year.trim().length === 4;

  const pickImage = useCallback(async () => {
    const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert(t.permissionRequired, t.permissionMsg);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);

      let b64 = asset.base64 ?? null;
      if (!b64 && asset.uri?.startsWith('data:')) {
        const comma = asset.uri.indexOf(',');
        b64 = comma >= 0 ? asset.uri.substring(comma + 1) : null;
      }
      if (b64 && b64.includes(';base64,')) {
        b64 = b64.split(';base64,')[1] ?? b64;
      }
      setImageBase64(b64);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting || !user?.id) return;
    setIsSubmitting(true);

    try {
      let publicUrl = imageUri;

      if (imageBase64) {
        const binaryStr = atob(imageBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        const filePath = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('garage')
          .upload(filePath, bytes, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('garage').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('garage_vehicles').insert({
        user_id: user.id,
        image_url: publicUrl,
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year, 10),
        nickname: nickname.trim() || null,
        power: power.trim() || null,
        acceleration: acceleration.trim() || null,
        transmission: transmission ?? null,
        drivetrain: drivetrain ?? null,
        fuel: fuel ?? null,
        color: color.trim() || null,
        mileage: mileage ? parseInt(mileage, 10) : null,
        acquired_at: acquiredAt.trim() || null,
        status: status ?? null,
        notes: notes.trim() || null,
      });

      if (insertError) throw insertError;

      navigation.goBack();
    } catch (err: any) {
      const msg = err?.message ?? t.errorMsg;
      Alert.alert(t.errorMsg, msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, user?.id, imageUri, imageBase64, brand, model, year, nickname, power, acceleration, transmission, drivetrain, fuel, color, mileage, acquiredAt, status, notes, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={C.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.addTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Photo ── */}
        <SectionTitle label={t.mainPhoto} />

        <Pressable style={styles.photoArea} onPress={pickImage}>
          {imageUri ? (
            <>
              <ExpoImage source={imageUri} style={styles.photoPreview} contentFit="cover" />
              <View style={styles.replaceOverlay}>
                <Ionicons name="camera-outline" size={20} color={C.white} />
                <Text style={styles.replaceText}>{t.replace}</Text>
              </View>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={36} color={C.whiteFaint} />
              <Text style={styles.photoPlaceholderText}>{t.addPhoto}</Text>
              <Text style={styles.photoPlaceholderHint}>{t.photoFormat}</Text>
            </View>
          )}
        </Pressable>

        {/* ── Identité ── */}
        <SectionTitle label={t.identity} />

        <BrandInput value={brand} onChangeText={setBrand} />

        <View style={styles.row}>
          <View style={{ flex: 3 }}>
            <Field label={t.model} value={model} onChangeText={setModel} placeholder="911 GT3 RS" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t.year} value={year} onChangeText={setYear} placeholder="2024" keyboardType="numeric" />
          </View>
        </View>

        <Field label={t.nickname} value={nickname} onChangeText={setNickname} placeholder="La rouge, Ma daily…" />

        {/* ── Techniques ── */}
        <SectionTitle label={t.technical} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label={t.power} value={power} onChangeText={setPower} placeholder="525hp" mono />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t.acceleration} value={acceleration} onChangeText={setAcceleration} placeholder="3.2s" mono />
          </View>
        </View>

        <ChipSelector label={t.transmission} options={TRANSMISSION_OPTIONS} value={transmission} onChange={setTransmission} />
        <ChipSelector label={t.drivetrain}    options={DRIVETRAIN_OPTIONS}   value={drivetrain}   onChange={setDrivetrain} />
        <ChipSelector label={t.fuel}          options={FUEL_OPTIONS}         value={fuel}         onChange={setFuel} />

        {/* ── Détails ── */}
        <SectionTitle label={t.details} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label={t.color}   value={color}   onChangeText={setColor}   placeholder="Argent" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t.mileage} value={mileage} onChangeText={setMileage} placeholder="24 800" keyboardType="numeric" mono />
          </View>
        </View>

        <Field label={t.acquiredAt} value={acquiredAt} onChangeText={setAcquiredAt} placeholder="MM/YYYY" />

        <ChipSelector label={t.status} options={STATUS_OPTIONS} value={status} onChange={setStatus} />

        {/* ── Notes ── */}
        <SectionTitle label={t.notes} />
        <Field
          label={t.history}
          value={notes}
          onChangeText={(v) => v.length <= 500 && setNotes(v)}
          placeholder={language === 'fr'
            ? 'Restauration complète en 2023, acquis lors d\'une enchère à Monaco…'
            : 'Full restoration in 2023, acquired at a Monaco auction…'}
          multiline
        />
        <Text style={styles.charCount}>{notes.length}/500</Text>

        {/* ── CTA ── */}
        <Pressable
          style={[styles.submitBtn, (!isValid || isSubmitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={C.white} />
          ) : (
            <>
              <Ionicons name="car-sport-outline" size={18} color={C.white} />
              <Text style={styles.submitBtnText}>{t.add}</Text>
            </>
          )}
        </Pressable>

        {!isValid && !isSubmitting && (
          <Text style={styles.validationHint}>{t.requiredHint}</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontFamily: MONO,
    fontSize: 15,
    letterSpacing: 2,
    color: C.white,
    fontWeight: '700',
  },

  content: { paddingHorizontal: 16, paddingTop: 8 },

  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  accentBar: {
    width: 3, height: 14, borderRadius: 1.5,
    backgroundColor: C.accent,
  },
  sectionTitleText: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    color: C.whiteSoft,
    fontWeight: '600',
  },

  // Photo
  photoArea: {
    width: '100%',
    height: (SCREEN_WIDTH - 32) * 9 / 16,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  replaceOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  replaceText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.white,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.whiteSoft,
  },
  photoPlaceholderHint: {
    fontFamily: MONO,
    fontSize: 12,
    color: C.whiteFaint,
    letterSpacing: 1,
  },

  row: { flexDirection: 'row', gap: 10 },

  // Fields
  fieldWrapper: { marginBottom: 10 },
  fieldLabel: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.whiteSoft,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.white,
    fontSize: 14,
    fontWeight: '500',
  },
  fieldInputMultiline: {
    minHeight: 110,
    paddingTop: 12,
  },

  // Suggestions
  suggestions: {
    marginTop: 4,
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  suggestionText: {
    fontSize: 13,
    color: C.white,
    fontWeight: '500',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  chipActive: {
    borderColor: C.borderActive,
    backgroundColor: 'rgba(229,9,20,0.12)',
  },
  chipText: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 1,
    color: C.whiteSoft,
    fontWeight: '600',
  },
  chipTextActive: { color: C.accent },

  charCount: {
    fontFamily: MONO,
    fontSize: 12,
    color: C.whiteFaint,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    backgroundColor: C.accent,
    borderRadius: 8,
    marginTop: 28,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontFamily: MONO,
    fontSize: 15,
    letterSpacing: 2,
    color: C.white,
    fontWeight: '700',
  },
  validationHint: {
    fontFamily: MONO,
    fontSize: 12,
    color: C.whiteFaint,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
