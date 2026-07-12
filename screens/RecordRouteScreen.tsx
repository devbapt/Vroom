import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Alert, ActivityIndicator, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import type { LocationSubscription } from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';
import { getTranslation } from '../i18n';

const C = {
  bg:          '#140102',
  surface:     '#1F0808',
  accent:      '#E50914',
  white:       '#FFFFFF',
  whiteSoft:   'rgba(255,255,255,0.7)',
  whiteFaint:  'rgba(255,255,255,0.2)',
  placeholder: 'rgba(255,255,255,0.4)',
  border:      'rgba(255,255,255,0.15)',
  success:     '#34C759',
  warning:     '#FF9F0A',
};

const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

type Point = { latitude: number; longitude: number; timestamp: number };

// Distance haversine entre deux points, en km
function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RecordRouteScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, language } = useAppContext();
  const t = getTranslation(language).map;

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const subscriptionRef = useRef<LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionGranted(status === 'granted');
      if (status === 'granted') {
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        } catch { /* garde la région par défaut */ }
      }
    })();

    return () => {
      subscriptionRef.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const distanceKm = points.reduce((sum, p, i) => (i === 0 ? 0 : sum + haversineKm(points[i - 1], p)), 0);

  const handleStart = useCallback(async () => {
    if (!permissionGranted) {
      Alert.alert(t.permissionTitle, t.permissionMsg);
      return;
    }
    setPoints([]);
    setElapsedSeconds(0);
    setFinished(false);
    startedAtRef.current = Date.now();
    setRecording(true);

    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    subscriptionRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
      (loc) => {
        const p: Point = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: loc.timestamp };
        setPoints((prev) => [...prev, p]);
      }
    );
  }, [permissionGranted, t]);

  const handleStop = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecording(false);
    setFinished(true);
  }, []);

  const handleSave = useCallback(async (publish: boolean) => {
    if (!user?.id || points.length < 2 || !title.trim() || saving) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      const waypoints = points.map((p) => ({ lat: p.latitude, lng: p.longitude }));
      const { error: routeError } = await supabase.from('saved_routes').insert({
        user_id: user.id,
        title: title.trim(),
        waypoints,
        distance_km: Math.round(distanceKm * 100) / 100,
        duration_seconds: elapsedSeconds,
      });
      if (routeError) throw routeError;

      if (publish) {
        const { error: mapError } = await supabase.from('map_points').insert({
          user_id: user.id,
          type: 'route',
          title: title.trim(),
          description: null,
          lat: points[0].latitude,
          lng: points[0].longitude,
          image_url: null,
          event_date: null,
          waypoints,
        });
        if (mapError) throw mapError;
      }

      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t.errorTitle, err?.message ?? t.errorMsg);
    } finally {
      setSaving(false);
    }
  }, [user?.id, points, title, saving, distanceKm, elapsedSeconds, navigation, t]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={C.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.recordRoute}</Text>
        <View style={{ width: 24 }} />
      </View>

      {!recording && !finished && (
        <View style={styles.warningBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={C.warning} />
          <Text style={styles.warningText}>{t.recordingWarning}</Text>
        </View>
      )}

      <View style={styles.mapWrap}>
        <MapView style={StyleSheet.absoluteFill} region={region} showsUserLocation={permissionGranted}>
          {points.length > 1 && (
            <Polyline coordinates={points} strokeColor={C.accent} strokeWidth={4} />
          )}
          {points.length > 0 && (
            <Marker coordinate={points[0]} pinColor={C.success} />
          )}
        </MapView>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        {recording && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{distanceKm.toFixed(2)} km</Text>
              <Text style={styles.statLabel}>{t.distanceLabel}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatDuration(elapsedSeconds)}</Text>
              <Text style={styles.statLabel}>{t.durationLabel}</Text>
            </View>
          </View>
        )}

        {recording && (
          <View style={styles.recordingIndicatorRow}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>{t.recordingInProgress}</Text>
          </View>
        )}

        {!finished ? (
          <Pressable
            style={[styles.actionBtn, recording ? styles.stopBtn : styles.startBtn]}
            onPress={recording ? handleStop : handleStart}
          >
            <Ionicons name={recording ? 'stop' : 'play'} size={20} color={C.white} />
            <Text style={styles.actionBtnText}>{recording ? t.stopRecording : t.startRecording}</Text>
          </Pressable>
        ) : (
          <View style={styles.finishForm}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{distanceKm.toFixed(2)} km</Text>
                <Text style={styles.statLabel}>{t.distanceLabel}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatDuration(elapsedSeconds)}</Text>
                <Text style={styles.statLabel}>{t.durationLabel}</Text>
              </View>
            </View>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder={t.routeNamePlaceholder}
              placeholderTextColor={C.placeholder}
            />
            <Pressable
              style={[styles.actionBtn, styles.startBtn, (!title.trim() || saving) && styles.actionBtnDisabled]}
              onPress={() => handleSave(false)}
              disabled={!title.trim() || saving}
            >
              {saving ? <ActivityIndicator size="small" color={C.white} /> : (
                <>
                  <Ionicons name="save-outline" size={18} color={C.white} />
                  <Text style={styles.actionBtnText}>{t.saveRoute}</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.publishBtn, (!title.trim() || saving) && styles.actionBtnDisabled]}
              onPress={() => handleSave(true)}
              disabled={!title.trim() || saving}
            >
              <Ionicons name="share-outline" size={16} color={C.accent} />
              <Text style={styles.publishBtnText}>{t.publishRoute}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.white },

  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,159,10,0.1)', borderWidth: 0.5, borderColor: 'rgba(255,159,10,0.3)',
    marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 10,
  },
  warningText: { flex: 1, fontSize: 12, color: C.whiteSoft, lineHeight: 17 },

  mapWrap: { flex: 1, margin: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },

  controls: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, backgroundColor: C.surface, borderRadius: 10, borderWidth: 0.5, borderColor: C.border,
    paddingVertical: 10, alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '800', color: C.white },
  statLabel: { fontSize: 10, color: C.whiteSoft, marginTop: 2, letterSpacing: 0.5 },

  recordingIndicatorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  recordingText: { fontSize: 12, color: C.whiteSoft, fontWeight: '600' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, height: 50,
  },
  actionBtnDisabled: { opacity: 0.4 },
  startBtn: { backgroundColor: C.success },
  stopBtn: { backgroundColor: C.accent },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: C.white },

  finishForm: { gap: 10 },
  titleInput: {
    backgroundColor: C.surface, borderRadius: 10, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12, color: C.white, fontSize: 14,
  },
  publishBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12,
  },
  publishBtnText: { fontSize: 13, fontWeight: '700', color: C.accent },
});
