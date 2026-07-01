import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, Linking,
  ActivityIndicator, Animated, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import MapView, { Marker, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';
import { getTranslation } from '../i18n';

// ─── Design tokens (cohérent avec le reste de l'app) ──────────────────────────

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

const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type PointType = 'event' | 'route';

type MapPoint = {
  id: string;
  user_id: string;
  type: PointType;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  image_url: string | null;
  event_date: string | null;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

type Filter = 'all' | PointType;

// ─── Marqueur custom ──────────────────────────────────────────────────────────

function PointMarker({ point, onPress }: { point: MapPoint; onPress: () => void }) {
  const isEvent = point.type === 'event';
  return (
    <Marker
      coordinate={{ latitude: point.lat, longitude: point.lng }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={[styles.pin, { backgroundColor: isEvent ? C.accent : C.success }]}>
        <Ionicons name={isEvent ? 'calendar' : 'flag'} size={14} color={C.white} />
      </View>
    </Marker>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, language } = useAppContext();
  const t = getTranslation(language).map;

  const [region, setRegion] = useState<Region | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<MapPoint | null>(null);

  const cardAnim = useRef(new Animated.Value(0)).current;

  // ── Permission + position ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setHasLocationPermission(true);
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          });
        } else {
          setPermissionDenied(true);
          setRegion(DEFAULT_REGION);
        }
      } catch {
        setPermissionDenied(true);
        setRegion(DEFAULT_REGION);
      }
    })();
  }, []);

  // ── Fetch des points ──────────────────────────────────────────────────────
  const fetchPoints = useCallback(async () => {
    const { data, error } = await supabase
      .from('map_points')
      .select('*, profiles!user_id(username, avatar_url)')
      .order('created_at', { ascending: false });
    if (!error && data) setPoints(data as unknown as MapPoint[]);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchPoints(); }, [fetchPoints]));

  // ── Sélection d'un point (carte de détail) ───────────────────────────────
  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      tension: 90,
      friction: 12,
    }).start();
  }, [selected, cardAnim]);

  const closeCard = useCallback(() => setSelected(null), []);

  // ── Itinéraire externe ────────────────────────────────────────────────────
  const handleGetDirections = useCallback((point: MapPoint) => {
    Alert.alert(t.getDirections, undefined, [
      {
        text: t.openInGoogleMaps,
        onPress: () => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`).catch(() => {
            Alert.alert(t.errorTitle, t.errorMsg);
          });
        },
      },
      {
        text: t.openInWaze,
        onPress: () => {
          Linking.openURL(`https://waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes`).catch(() => {
            Alert.alert(t.errorTitle, t.errorMsg);
          });
        },
      },
      { text: t.cancel, style: 'cancel' },
    ]);
  }, [t]);

  // ── Suppression (auteur uniquement) ──────────────────────────────────────
  const handleDelete = useCallback((point: MapPoint) => {
    Alert.alert(t.deleteConfirmTitle, t.deleteConfirmMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('map_points').delete().eq('id', point.id);
          if (error) {
            Alert.alert(t.errorTitle, t.errorMsg);
            return;
          }
          setPoints((prev) => prev.filter((p) => p.id !== point.id));
          closeCard();
        },
      },
    ]);
  }, [t, closeCard]);

  const filteredPoints = filter === 'all' ? points : points.filter((p) => p.type === filter);

  if (!region) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
      >
        {filteredPoints.map((p) => (
          <PointMarker key={p.id} point={p} onPress={() => setSelected(p)} />
        ))}
      </MapView>

      {/* ── Filtres ── */}
      <View style={[styles.filterRow, { top: insets.top + 12 }]}>
        {([
          { key: 'all' as Filter,   label: t.filterAll },
          { key: 'event' as Filter, label: t.filterEvents },
          { key: 'route' as Filter, label: t.filterRoutes },
        ]).map((opt) => {
          const active = filter === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(opt.key)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Bannière permission refusée ── */}
      {permissionDenied && (
        <Pressable
          style={[styles.banner, { top: insets.top + 56 }]}
          onPress={() => Linking.openSettings()}
        >
          <Ionicons name="location-outline" size={16} color={C.warning} />
          <Text style={styles.bannerText} numberOfLines={2}>{t.permissionMsg}</Text>
        </Pressable>
      )}

      {/* ── Empty state ── */}
      {!loading && points.length === 0 && (
        <View style={[styles.banner, { top: insets.top + (permissionDenied ? 100 : 56) }]}>
          <Ionicons name="information-circle-outline" size={16} color={C.whiteSoft} />
          <Text style={styles.bannerText} numberOfLines={2}>{t.emptyHint}</Text>
        </View>
      )}

      {/* ── FAB ajouter un point ── */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('AddMapPoint')}
      >
        <Ionicons name="add" size={28} color={C.white} />
      </Pressable>

      {/* ── Carte de détail ── */}
      {selected && (
        <Pressable style={styles.backdrop} onPress={closeCard}>
          <Animated.View
            style={[
              styles.detailCard,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                opacity: cardAnim,
                transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.detailHandle} />

              <View style={styles.detailHeader}>
                <View style={[styles.typeBadge, { backgroundColor: selected.type === 'event' ? C.accent : C.success }]}>
                  <Ionicons name={selected.type === 'event' ? 'calendar' : 'flag'} size={12} color={C.white} />
                  <Text style={styles.typeBadgeText}>{selected.type === 'event' ? t.typeEvent : t.typeRoute}</Text>
                </View>
                <Pressable onPress={closeCard} hitSlop={10}>
                  <Ionicons name="close" size={22} color={C.muted} />
                </Pressable>
              </View>

              <Text style={styles.detailTitle}>{selected.title}</Text>

              {selected.profiles?.username && (
                <Text style={styles.detailAuthor}>{t.by} @{selected.profiles.username}</Text>
              )}

              {selected.type === 'event' && selected.event_date && (
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={14} color={C.muted} />
                  <Text style={styles.detailRowText}>{selected.event_date}</Text>
                </View>
              )}

              {selected.description && (
                <Text style={styles.detailDescription}>{selected.description}</Text>
              )}

              {selected.image_url && (
                <ExpoImage source={selected.image_url} style={styles.detailImage} contentFit="cover" />
              )}

              <Pressable style={styles.directionsBtn} onPress={() => handleGetDirections(selected)}>
                <Ionicons name="navigate" size={18} color={C.white} />
                <Text style={styles.directionsBtnText}>{t.getDirections}</Text>
              </Pressable>

              {selected.user_id === user?.id && (
                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(selected)}>
                  <Ionicons name="trash-outline" size={16} color={C.accent} />
                  <Text style={styles.deleteBtnText}>{t.deletePoint}</Text>
                </Pressable>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  pin: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.white,
  },

  filterRow: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(20,1,2,0.85)',
    borderWidth: 1, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterChipText: { fontSize: 12, fontWeight: '600', color: C.whiteSoft },
  filterChipTextActive: { color: C.white },

  banner: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(20,1,2,0.92)',
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bannerText: { flex: 1, fontSize: 12, color: C.whiteSoft, lineHeight: 16 },

  fab: {
    position: 'absolute', right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.accent,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },

  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: C.bgCard,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 10,
    borderWidth: 1, borderColor: C.border, borderBottomWidth: 0,
  },
  detailHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginBottom: 14,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: C.white },
  detailTitle: { fontSize: 18, fontWeight: '800', color: C.white, marginBottom: 4 },
  detailAuthor: { fontSize: 12, color: C.muted, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  detailRowText: { fontSize: 13, color: C.whiteSoft },
  detailDescription: { fontSize: 13, color: C.whiteSoft, lineHeight: 19, marginBottom: 12 },
  detailImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, marginBottom: 14, backgroundColor: '#000' },

  directionsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.accent, borderRadius: 12, height: 50, marginBottom: 10,
  },
  directionsBtnText: { fontSize: 15, fontWeight: '700', color: C.white },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: C.accent },
});
