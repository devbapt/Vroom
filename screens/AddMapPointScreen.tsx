import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';
import { getTranslation } from '../i18n';

const C = {
  bg:          '#140102',
  surface:     '#1F0808',
  accent:      '#E50914',
  white:       '#FFFFFF',
  whiteSoft:   'rgba(255,255,255,0.6)',
  whiteFaint:  'rgba(255,255,255,0.2)',
  placeholder: 'rgba(255,255,255,0.4)',
  border:      'rgba(255,255,255,0.15)',
  success:     '#34C759',
};

type PointType = 'event' | 'route';
type LocationMode = 'gps' | 'map' | 'address';

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.accentBar} />
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
  );
}

export default function AddMapPointScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, language } = useAppContext();
  const t = getTranslation(language).map;

  const [pointType, setPointType] = useState<PointType>('event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');

  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationMode, setLocationMode] = useState<LocationMode>('gps');
  const [pickerRegion, setPickerRegion] = useState<Region>(DEFAULT_REGION);

  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState<NominatimResult[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState<string | null>(null);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [waypoints, setWaypoints] = useState<{ latitude: number; longitude: number }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Position actuelle au montage ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setPickerRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          });
        } else {
          // Pas de permission — l'utilisateur devra choisir sur la carte ou saisir une adresse
          setLocationMode('map');
        }
      } catch {
        setLocationMode('map');
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  // ── Recherche d'adresse (Nominatim/OpenStreetMap, gratuit, sans clé) ─────
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAddressResults([]);
      return;
    }
    setIsSearchingAddress(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'VroomApp/1.0 (contact: baptiste.faux14@gmail.com)' },
      });
      const data = await res.json();
      setAddressResults(Array.isArray(data) ? data : []);
    } catch {
      setAddressResults([]);
    } finally {
      setIsSearchingAddress(false);
    }
  }, []);

  const handleAddressChange = useCallback((text: string) => {
    setAddressQuery(text);
    setSelectedAddressLabel(null);
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    addressDebounceRef.current = setTimeout(() => searchAddress(text), 600);
  }, [searchAddress]);

  const handleSelectAddress = useCallback((result: NominatimResult) => {
    const resultLat = parseFloat(result.lat);
    const resultLng = parseFloat(result.lon);
    setLat(resultLat);
    setLng(resultLng);
    setPickerRegion({ latitude: resultLat, longitude: resultLng, latitudeDelta: 0.03, longitudeDelta: 0.03 });
    setSelectedAddressLabel(result.display_name);
    setAddressResults([]);
  }, []);

  const isValid = title.trim() !== '' && lat !== null && lng !== null;

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.permissionTitle, t.permissionMsg);
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
      if (b64?.includes(';base64,')) b64 = b64.split(';base64,')[1] ?? b64;
      setImageBase64(b64);
    }
  }, [t]);

  const handleMapPick = useCallback((coordinate: { latitude: number; longitude: number }) => {
    if (pointType === 'route') {
      setWaypoints((prev) => {
        const next = [...prev, coordinate];
        setLat(next[0].latitude);
        setLng(next[0].longitude);
        return next;
      });
      return;
    }
    setLat(coordinate.latitude);
    setLng(coordinate.longitude);
  }, [pointType]);

  const handleUndoWaypoint = useCallback(() => {
    setWaypoints((prev) => {
      const next = prev.slice(0, -1);
      if (next.length > 0) {
        setLat(next[0].latitude);
        setLng(next[0].longitude);
      } else {
        setLat(null);
        setLng(null);
      }
      return next;
    });
  }, []);

  const handleClearWaypoints = useCallback(() => {
    setWaypoints([]);
    setLat(null);
    setLng(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t.titleRequired, t.titleRequiredMsg);
      return;
    }
    if (lat === null || lng === null) {
      Alert.alert(t.locationRequired, t.locationRequiredMsg);
      return;
    }
    if (!user?.id || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (imageBase64) {
        const binaryStr = atob(imageBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        const filePath = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('map_points')
          .upload(filePath, bytes, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('map_points').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('map_points').insert({
        user_id: user.id,
        type: pointType,
        title: title.trim(),
        description: description.trim() || null,
        lat,
        lng,
        image_url: imageUrl,
        event_date: pointType === 'event' ? (eventDate.trim() || null) : null,
        waypoints: pointType === 'route' && waypoints.length > 1
          ? waypoints.map((w) => ({ lat: w.latitude, lng: w.longitude }))
          : null,
      });

      if (insertError) throw insertError;

      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t.errorTitle, err?.message ?? t.errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [title, lat, lng, user?.id, isSubmitting, imageBase64, pointType, description, eventDate, waypoints, t, navigation]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={C.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.newPoint}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Type ── */}
        <SectionTitle label={t.newPoint} />
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeChip, pointType === 'event' && styles.typeChipActive]}
            onPress={() => { setPointType('event'); setWaypoints([]); }}
          >
            <Ionicons name="calendar" size={16} color={pointType === 'event' ? C.white : C.whiteSoft} />
            <Text style={[styles.typeChipText, pointType === 'event' && styles.typeChipTextActive]}>{t.typeEvent}</Text>
          </Pressable>
          <Pressable
            style={[styles.typeChip, pointType === 'route' && styles.typeChipActive]}
            onPress={() => setPointType('route')}
          >
            <Ionicons name="flag" size={16} color={pointType === 'route' ? C.white : C.whiteSoft} />
            <Text style={[styles.typeChipText, pointType === 'route' && styles.typeChipTextActive]}>{t.typeRoute}</Text>
          </Pressable>
        </View>

        {/* ── Titre ── */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>{t.titleField}</Text>
          <TextInput
            style={styles.fieldInput}
            value={title}
            onChangeText={setTitle}
            placeholder={t.titlePlaceholder}
            placeholderTextColor={C.placeholder}
          />
        </View>

        {/* ── Description ── */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>{t.descriptionField}</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldInputMultiline]}
            value={description}
            onChangeText={(v) => v.length <= 300 && setDescription(v)}
            placeholder={t.descriptionPlaceholder}
            placeholderTextColor={C.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/300</Text>
        </View>

        {/* ── Date (événement uniquement) ── */}
        {pointType === 'event' && (
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>{t.eventDate}</Text>
            <TextInput
              style={styles.fieldInput}
              value={eventDate}
              onChangeText={setEventDate}
              placeholder={t.eventDatePlaceholder}
              placeholderTextColor={C.placeholder}
            />
          </View>
        )}

        {/* ── Photo ── */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>{t.photoOptional}</Text>
          <Pressable style={styles.photoArea} onPress={pickImage}>
            {imageUri ? (
              <ExpoImage source={imageUri} style={styles.photoPreview} contentFit="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={30} color={C.whiteFaint} />
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Position ── */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>{t.useCurrentLocation}</Text>

          <View style={styles.locationModeRow}>
            <Pressable
              style={[styles.locationModeChip, locationMode === 'gps' && styles.locationModeChipActive]}
              onPress={() => setLocationMode('gps')}
            >
              <Ionicons name="locate" size={13} color={locationMode === 'gps' ? C.white : C.whiteSoft} />
              <Text style={[styles.locationModeChipText, locationMode === 'gps' && styles.locationModeChipTextActive]}>
                {t.useCurrentLocation}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.locationModeChip, locationMode === 'map' && styles.locationModeChipActive]}
              onPress={() => setLocationMode('map')}
            >
              <Ionicons name="map" size={13} color={locationMode === 'map' ? C.white : C.whiteSoft} />
              <Text style={[styles.locationModeChipText, locationMode === 'map' && styles.locationModeChipTextActive]}>
                {t.pickOnMap}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.locationModeChip, locationMode === 'address' && styles.locationModeChipActive]}
              onPress={() => setLocationMode('address')}
            >
              <Ionicons name="search" size={13} color={locationMode === 'address' ? C.white : C.whiteSoft} />
              <Text style={[styles.locationModeChipText, locationMode === 'address' && styles.locationModeChipTextActive]}>
                {t.searchAddress}
              </Text>
            </Pressable>
          </View>

          {locationLoading ? (
            <View style={styles.locationLoading}>
              <ActivityIndicator color={C.accent} size="small" />
            </View>
          ) : locationMode === 'map' ? (
            <View>
              {pointType === 'route' && (
                <Text style={styles.addWaypointHint}>{t.addWaypointHint}</Text>
              )}
              <View style={styles.pickerMapWrap}>
                <MapView
                  style={StyleSheet.absoluteFill}
                  initialRegion={pickerRegion}
                  onPress={(e) => handleMapPick(e.nativeEvent.coordinate)}
                >
                  {pointType === 'route' ? (
                    <>
                      {waypoints.map((w, i) => (
                        <Marker key={i} coordinate={w} pinColor={i === 0 ? C.success : C.accent} />
                      ))}
                      {waypoints.length > 1 && (
                        <Polyline coordinates={waypoints} strokeColor={C.accent} strokeWidth={3} />
                      )}
                    </>
                  ) : (
                    lat !== null && lng !== null && (
                      <Marker
                        coordinate={{ latitude: lat, longitude: lng }}
                        draggable
                        onDragEnd={(e) => handleMapPick(e.nativeEvent.coordinate)}
                      />
                    )
                  )}
                </MapView>
              </View>
              {pointType === 'route' && waypoints.length > 0 && (
                <View style={styles.waypointActionsRow}>
                  <Pressable style={styles.waypointActionBtn} onPress={handleUndoWaypoint}>
                    <Text style={styles.waypointActionText}>{t.undoLastPoint}</Text>
                  </Pressable>
                  <Pressable style={styles.waypointActionBtn} onPress={handleClearWaypoints}>
                    <Text style={styles.waypointActionText}>{t.clearWaypoints}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : locationMode === 'address' ? (
            <View>
              <View style={styles.addressSearchRow}>
                <TextInput
                  style={[styles.fieldInput, styles.addressInput]}
                  value={addressQuery}
                  onChangeText={handleAddressChange}
                  placeholder={t.addressPlaceholder}
                  placeholderTextColor={C.placeholder}
                  onSubmitEditing={() => searchAddress(addressQuery)}
                  returnKeyType="search"
                />
                {isSearchingAddress && <ActivityIndicator color={C.accent} size="small" style={styles.addressSpinner} />}
              </View>

              {addressResults.length > 0 && (
                <View style={styles.addressResults}>
                  {addressResults.map((r, i) => (
                    <Pressable
                      key={`${r.lat}-${r.lon}-${i}`}
                      style={styles.addressResultRow}
                      onPress={() => handleSelectAddress(r)}
                    >
                      <Ionicons name="location-outline" size={14} color={C.whiteSoft} />
                      <Text style={styles.addressResultText} numberOfLines={2}>{r.display_name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {addressResults.length === 0 && !isSearchingAddress && addressQuery.trim().length > 0 && !selectedAddressLabel && (
                <Text style={styles.coordsText}>{t.noResults}</Text>
              )}

              {selectedAddressLabel && lat !== null && lng !== null && (
                <View style={styles.selectedAddressWrap}>
                  <Text style={styles.selectedAddressText} numberOfLines={2}>{selectedAddressLabel}</Text>
                  <View style={styles.pickerMapWrap}>
                    <MapView
                      style={StyleSheet.absoluteFill}
                      region={pickerRegion}
                      pointerEvents="none"
                    >
                      <Marker coordinate={{ latitude: lat, longitude: lng }} />
                    </MapView>
                  </View>
                </View>
              )}
            </View>
          ) : lat !== null && lng !== null ? (
            <Text style={styles.coordsText}>{lat.toFixed(5)}, {lng.toFixed(5)}</Text>
          ) : (
            <Text style={styles.coordsText}>{t.locationRequiredMsg}</Text>
          )}
        </View>

        {/* ── CTA ── */}
        <Pressable
          style={[styles.submitBtn, (!isValid || isSubmitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={C.white} />
          ) : (
            <Text style={styles.submitBtnText}>{t.publish}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.white },

  content: { paddingHorizontal: 16, paddingTop: 8 },

  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 12 },
  accentBar: { width: 3, height: 14, borderRadius: 1.5, backgroundColor: C.accent },
  sectionTitleText: { fontSize: 12, letterSpacing: 2, color: C.whiteSoft, fontWeight: '600' },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  typeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  typeChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  typeChipText: { fontSize: 13, fontWeight: '600', color: C.whiteSoft },
  typeChipTextActive: { color: C.white },

  fieldWrapper: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, letterSpacing: 1, color: C.whiteSoft, marginBottom: 6, fontWeight: '600' },
  fieldInput: {
    backgroundColor: C.surface, borderRadius: 8,
    borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
    color: C.white, fontSize: 14, fontWeight: '500',
  },
  fieldInputMultiline: { minHeight: 90, paddingTop: 12 },
  charCount: { fontSize: 11, color: C.whiteFaint, textAlign: 'right', marginTop: 4 },

  photoArea: {
    width: '100%', aspectRatio: 16 / 9, borderRadius: 10, overflow: 'hidden',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  locationLoading: { height: 44, justifyContent: 'center', alignItems: 'center' },
  coordsText: { fontSize: 13, color: C.whiteSoft, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  locationModeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  locationModeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  locationModeChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  locationModeChipText: { fontSize: 11, fontWeight: '600', color: C.whiteSoft },
  locationModeChipTextActive: { color: C.white },

  addressSearchRow: { position: 'relative', justifyContent: 'center' },
  addressInput: { paddingRight: 40 },
  addressSpinner: { position: 'absolute', right: 12 },
  addressResults: {
    marginTop: 8, borderRadius: 10, overflow: 'hidden',
    backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border,
  },
  addressResultRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  addressResultText: { flex: 1, fontSize: 12.5, color: C.white, lineHeight: 17 },
  selectedAddressWrap: { marginTop: 10, gap: 8 },
  selectedAddressText: { fontSize: 12.5, color: C.whiteSoft, lineHeight: 17 },

  addWaypointHint: { fontSize: 11.5, color: C.whiteSoft, marginBottom: 8, lineHeight: 16 },
  waypointActionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  waypointActionBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border,
  },
  waypointActionText: { fontSize: 11.5, fontWeight: '600', color: C.whiteSoft },
  pickerMapWrap: {
    height: 180, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },

  submitBtn: {
    height: 50, borderRadius: 8, backgroundColor: C.accent,
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 15, fontWeight: '700', letterSpacing: 1, color: C.white },
});
