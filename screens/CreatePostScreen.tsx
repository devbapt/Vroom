import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';
import type {
  CineDrivePostType,
  AnyHUD,
  CineDrivePost,
} from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  bg: '#140102',
  surface: 'rgba(255,255,255,0.05)',
  surfaceActive: 'rgba(229,9,20,0.12)',
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.6)',
  whiteFaint: 'rgba(255,255,255,0.2)',
  border: 'rgba(255,255,255,0.1)',
  borderActive: 'rgba(229,9,20,0.6)',
  inputBg: 'rgba(255,255,255,0.07)',
};

// ─── Post type definitions ────────────────────────────────────────────────────

type PostTypeConfig = {
  type: CineDrivePostType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const POST_TYPES: PostTypeConfig[] = [
  { type: 'track',     label: 'TRACK',     icon: 'speedometer-outline' },
  { type: 'road_trip', label: 'ROAD TRIP',  icon: 'map-outline' },
  { type: 'meet',      label: 'MEET',       icon: 'people-outline' },
  { type: 'daily',     label: 'DAILY',      icon: 'car-outline' },
  { type: 'build',     label: 'BUILD',      icon: 'construct-outline' },
  { type: 'spotted',   label: 'SPOTTED',    icon: 'eye-outline' },
];

// ─── HUD field definitions ────────────────────────────────────────────────────

type HUDFieldDef = { key: string; label: string; placeholder: string; keyboardType?: 'default' | 'numeric' };

const HUD_FIELDS: Record<CineDrivePostType, HUDFieldDef[]> = {
  track: [
    { key: 'power',        label: 'POWER (hp)',     placeholder: '525hp' },
    { key: 'acceleration', label: '0–100 (s)',      placeholder: '3.2s' },
    { key: 'lapTime',      label: 'LAP TIME',       placeholder: '1:58.4' },
    { key: 'avgSpeed',     label: 'VIT. MOY. (km/h)', placeholder: '142 km/h' },
  ],
  road_trip: [
    { key: 'distance', label: 'DISTANCE',  placeholder: '142km' },
    { key: 'duration', label: 'DURÉE',     placeholder: '3h12' },
    { key: 'crew',     label: 'CREW (nb voitures)', placeholder: '4' },
  ],
  meet: [
    { key: 'city',   label: 'VILLE',    placeholder: 'PARIS' },
    { key: 'people', label: 'PERSONNES', placeholder: '120+' },
    { key: 'cars',   label: 'VOITURES', placeholder: '87' },
  ],
  daily: [
    { key: 'power',        label: 'POWER (hp)',     placeholder: '365hp' },
    { key: 'acceleration', label: '0–100 (s)',      placeholder: '4.6s' },
    { key: 'transmission', label: 'TRANSMISSION',   placeholder: 'PDK' },
  ],
  build: [
    { key: 'mods',   label: 'MODS',    placeholder: '12/15' },
    { key: 'budget', label: 'BUDGET',  placeholder: '€42k' },
    { key: 'phase',  label: 'PHASE',   placeholder: '3/5' },
  ],
  spotted: [
    { key: 'city',  label: 'VILLE',  placeholder: 'GENÈVE' },
    { key: 'model', label: 'MODÈLE', placeholder: 'CHIRON' },
  ],
};

// ─── Helper: build HUD from form values ───────────────────────────────────────

function buildHUD(type: CineDrivePostType, hudValues: Record<string, string>, rarity: 1|2|3|4|5): AnyHUD {
  switch (type) {
    case 'track':
      return { kind: 'track', power: hudValues.power || '—', acceleration: hudValues.acceleration || '—', lapTime: hudValues.lapTime || '—', avgSpeed: hudValues.avgSpeed || '—' };
    case 'road_trip':
      return { kind: 'road_trip', distance: hudValues.distance || '—', duration: hudValues.duration || '—', crew: hudValues.crew || '—' };
    case 'meet':
      return { kind: 'meet', city: hudValues.city || '—', people: hudValues.people || '—', cars: hudValues.cars || '—' };
    case 'daily':
      return { kind: 'daily', power: hudValues.power || '—', acceleration: hudValues.acceleration || '—', transmission: hudValues.transmission || '—' };
    case 'build':
      return { kind: 'build', mods: hudValues.mods || '—', budget: hudValues.budget || '—', phase: hudValues.phase || '—' };
    case 'spotted':
      return { kind: 'spotted', city: hudValues.city || '—', model: hudValues.model || '—', rarity };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.accentBar} />
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.fieldWrapper}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.whiteFaint}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        selectionColor={C.accent}
      />
    </View>
  );
}

function RaritySelector({ value, onChange }: { value: number; onChange: (v: 1|2|3|4|5) => void }) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>RARETÉ</Text>
      <View style={styles.rarityRow}>
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            hitSlop={8}
          >
            <Ionicons
              name={n <= value ? 'star' : 'star-outline'}
              size={28}
              color={n <= value ? C.accent : C.whiteFaint}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, addCinePost } = useAppContext();

  const [photos, setPhotos] = useState<{ uri: string; base64: string | null }[]>([]);
  const [postType, setPostType] = useState<CineDrivePostType>('road_trip');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [hudValues, setHudValues] = useState<Record<string, string>>({});
  const [rarity, setRarity] = useState<1|2|3|4|5>(3);

  const handleHudChange = useCallback((key: string, val: string) => {
    setHudValues(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleTypeChange = useCallback((type: CineDrivePostType) => {
    setPostType(type);
    setHudValues({});
  }, []);

  const pickPhotos = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Accès à la galerie nécessaire pour ajouter des photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 6,
      base64: true,
    });
    if (!result.canceled) {
      const picked = result.assets.map(a => {
        let b64: string | null = a.base64 ?? null;
        if (!b64 && a.uri?.startsWith('data:')) {
          const comma = a.uri.indexOf(',');
          b64 = comma >= 0 ? a.uri.substring(comma + 1) : null;
        }
        if (b64?.includes(';base64,')) b64 = b64.split(';base64,')[1] ?? b64;
        return { uri: a.uri, base64: b64 };
      });
      setPhotos(prev => [...prev, ...picked].slice(0, 6));
    }
  }, []);

  const [isPublishing, setIsPublishing] = useState(false);

  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handlePublish = useCallback(async () => {
    if (photos.length === 0) {
      Alert.alert('Photo requise', 'Ajoute au moins une photo pour publier.');
      return;
    }
    if (!brand.trim()) {
      Alert.alert('Véhicule requis', 'Renseigne la marque de ton véhicule.');
      return;
    }
    if (!user?.id) return;

    setIsPublishing(true);
    try {
      const timestamp = Date.now();
      const imageUrls: string[] = [];

      // Upload each photo to Supabase Storage
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo.base64) continue;

        const binaryStr = atob(photo.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) bytes[j] = binaryStr.charCodeAt(j);

        const filePath = `${user.id}/${timestamp}/${i}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, bytes, { contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filePath);
          imageUrls.push(urlData.publicUrl);
        }
      }

      const hud = buildHUD(postType, hudValues, rarity);

      const { data: inserted, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          type: postType,
          brand: brand.trim().toUpperCase(),
          model: model.trim().toUpperCase(),
          year: year ? parseInt(year, 10) : null,
          location: location.trim() || null,
          description: description.trim() || null,
          image_urls: imageUrls,
          hud_data: hud,
        })
        .select()
        .single();

      if (insertError) {
        Alert.alert('Erreur', 'Impossible de publier le post.');
        return;
      }

      // Add to local feed immediately
      const newPost: CineDrivePost = {
        id: inserted?.id ?? String(timestamp),
        type: postType,
        user: { id: user.id, username: user.username ?? '', avatar: user.avatar ?? '' },
        vehicle: {
          brand: brand.trim().toUpperCase(),
          model: model.trim().toUpperCase(),
          year: year ? parseInt(year, 10) : undefined,
        },
        location: location.trim() || undefined,
        image: imageUrls[0] ?? photos[0]?.uri ?? '',
        photos: imageUrls.length > 0 ? imageUrls : photos.map(p => p.uri),
        pages: imageUrls.map((_, i) => ({ id: `pg${i + 1}`, type: 'photo' as const })),
        hud,
        description: description.trim() || undefined,
        likes: 0,
        isLiked: false,
        comments: 0,
        isSaved: false,
        createdAt: new Date().toISOString(),
      };

      addCinePost(newPost);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la publication.');
    } finally {
      setIsPublishing(false);
    }
  }, [photos, brand, model, year, location, description, postType, hudValues, rarity, user, addCinePost, navigation]);

  const hudFields = HUD_FIELDS[postType];

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
        <Text style={styles.headerTitle}>NOUVEAU POST</Text>
        <Pressable
          style={({ pressed }) => [styles.publishBtn, pressed && { opacity: 0.8 }]}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          <Text style={styles.publishBtnText}>{isPublishing ? '...' : 'PUBLIER'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Photo Picker ── */}
        <SectionTitle label="PHOTOS" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoRow}
        >
          {photos.map((photo, i) => (
            <View key={i} style={styles.photoThumbWrapper}>
              <ExpoImage source={photo.uri} style={styles.photoThumb} contentFit="cover" />
              <Pressable
                style={styles.removePhotoBtn}
                onPress={() => removePhoto(i)}
                hitSlop={4}
              >
                <Ionicons name="close-circle" size={20} color={C.accent} />
              </Pressable>
              {i === 0 && (
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>MAIN</Text>
                </View>
              )}
            </View>
          ))}
          {photos.length < 6 && (
            <Pressable
              style={({ pressed }) => [styles.addPhotoBtn, pressed && { opacity: 0.7 }]}
              onPress={pickPhotos}
            >
              <Ionicons name="add" size={32} color={C.whiteSoft} />
              <Text style={styles.addPhotoText}>
                {photos.length === 0 ? 'Ajouter des photos' : 'Ajouter'}
              </Text>
            </Pressable>
          )}
        </ScrollView>

        {/* ── Post Type ── */}
        <SectionTitle label="TYPE DE POST" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRow}
        >
          {POST_TYPES.map(({ type, label, icon }) => {
            const active = postType === type;
            return (
              <Pressable
                key={type}
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => handleTypeChange(type)}
              >
                <Ionicons
                  name={icon}
                  size={14}
                  color={active ? C.accent : C.whiteSoft}
                />
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Vehicle ── */}
        <SectionTitle label="VÉHICULE" />

        <View style={styles.vehicleRow}>
          <View style={{ flex: 2 }}>
            <FieldInput label="MARQUE" value={brand} onChangeText={setBrand} placeholder="PORSCHE" />
          </View>
          <View style={{ flex: 3 }}>
            <FieldInput label="MODÈLE" value={model} onChangeText={setModel} placeholder="911 GT3 RS" />
          </View>
          <View style={{ flex: 1 }}>
            <FieldInput label="ANNÉE" value={year} onChangeText={setYear} placeholder="2024" keyboardType="numeric" />
          </View>
        </View>

        {/* ── Location ── */}
        <SectionTitle label="LIEU" />
        <FieldInput value={location} onChangeText={setLocation} placeholder="Col de Turini, France" />

        {/* ── HUD Data ── */}
        <SectionTitle label="DONNÉES SESSION" />

        <View style={styles.hudGrid}>
          {hudFields.map((field) => (
            <View key={field.key} style={styles.hudFieldWrapper}>
              <FieldInput
                label={field.label}
                value={hudValues[field.key] ?? ''}
                onChangeText={(v) => handleHudChange(field.key, v)}
                placeholder={field.placeholder}
              />
            </View>
          ))}
          {postType === 'spotted' && (
            <View style={styles.hudFieldWrapper}>
              <RaritySelector value={rarity} onChange={setRarity} />
            </View>
          )}
        </View>

        {/* ── Description ── */}
        <SectionTitle label="DESCRIPTION (optionnel)" />
        <FieldInput
          value={description}
          onChangeText={setDescription}
          placeholder="Décris ta session, ton véhicule, l'ambiance..."
          multiline
        />
        <Text style={styles.charCount}>{description.length}/300</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
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
    fontSize: 15,
    letterSpacing: 2,
    color: C.white,
    fontWeight: '600',
  },
  publishBtn: {
    backgroundColor: C.accent,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  publishBtnText: {
    fontSize: 13,
    letterSpacing: 1.5,
    color: C.white,
    fontWeight: '700',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Section title
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  accentBar: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
    backgroundColor: C.accent,
  },
  sectionTitleText: {
    fontSize: 12,
    letterSpacing: 2,
    color: C.whiteSoft,
    fontWeight: '600',
  },

  // Photos
  photoRow: {
    gap: 10,
    paddingBottom: 4,
  },
  photoThumbWrapper: {
    position: 'relative',
  },
  photoThumb: {
    width: 100,
    height: 140,
    borderRadius: 8,
    backgroundColor: C.surface,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: C.bg,
    borderRadius: 10,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: C.accent,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mainBadgeText: {
    fontSize: 10,
    letterSpacing: 1,
    color: C.white,
    fontWeight: '700',
  },
  addPhotoBtn: {
    width: 100,
    height: 140,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.whiteFaint,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addPhotoText: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: C.whiteSoft,
    textAlign: 'center',
  },

  // Post type chips
  typeRow: {
    gap: 8,
    paddingBottom: 4,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  typeChipActive: {
    borderColor: C.borderActive,
    backgroundColor: C.surfaceActive,
  },
  typeChipText: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: C.whiteSoft,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: C.accent,
  },

  // Vehicle row
  vehicleRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Fields
  fieldWrapper: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.whiteSoft,
    marginBottom: 5,
  },
  fieldInput: {
    backgroundColor: C.inputBg,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.white,
    fontSize: 15,
    fontWeight: '500',
  },
  fieldInputMultiline: {
    minHeight: 100,
    paddingTop: 10,
  },

  // HUD grid
  hudGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hudFieldWrapper: {
    flex: 1,
    minWidth: '28%',
  },

  // Rarity
  rarityRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },

  // Char count
  charCount: {
    fontSize: 12,
    color: C.whiteFaint,
    textAlign: 'right',
    marginTop: 4,
  },
});
